import { dbClient } from '../db';
import type { 
  UserCheckin, 
  CreditPackage, 
  CreditPurchase, 
  GenerationHistory,
  UserLevel,
  CheckinResult,
  CheckinStatus,
  PurchaseResult
} from '@/types';

export class CreditsDAO {
  
  // 积分包配置
  static readonly CREDIT_PACKAGES: CreditPackage[] = [
    { name: '入门体验包', price: 6, baseCredits: 10, bonusCredits: 2, totalCredits: 12, description: '新用户试用' },
    { name: '基础使用包', price: 30, baseCredits: 50, bonusCredits: 15, totalCredits: 65, description: '轻度用户' },
    { name: '热门推荐包', price: 98, baseCredits: 170, bonusCredits: 50, totalCredits: 220, description: '中度用户' },
    { name: '专业用户包', price: 198, baseCredits: 350, bonusCredits: 100, totalCredits: 450, description: '重度用户' },
    { name: '商业用户包', price: 328, baseCredits: 600, bonusCredits: 180, totalCredits: 780, description: '商业用户' },
    { name: '企业定制包', price: 648, baseCredits: 1300, bonusCredits: 400, totalCredits: 1700, description: '企业用户' }
  ];

  // 获取周数
  private static getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  // 用户签到
  static async userCheckin(userId: number, userLevel: UserLevel): Promise<CheckinResult> {
    const now = new Date();
    
    // 根据用户等级确定签到类型和周期
    const isWeeklyUser = userLevel === 'free';
    const checkinType = isWeeklyUser ? 'weekly' : 'daily';
    
    // 生成签到周期标识
    let checkinPeriod: string;
    if (isWeeklyUser) {
      const year = now.getFullYear();
      const week = this.getWeekNumber(now);
      checkinPeriod = `${year}-W${week.toString().padStart(2, '0')}`;
    } else {
      checkinPeriod = now.toISOString().split('T')[0]; // YYYY-MM-DD
    }
    
    try {
      // 检查是否已签到
      const existingCheckin = await dbClient.execute({
        sql: 'SELECT id FROM user_checkins WHERE user_id = ? AND checkin_period = ?',
        args: [userId, checkinPeriod]
      });
      
      if (existingCheckin.rows.length > 0) {
        const periodDesc = isWeeklyUser ? '本周' : '今日';
        return { success: false, message: `${periodDesc}已签到` };
      }
      
      // 开始事务：发放积分并记录签到
      const creditsAwarded = 6;
      await dbClient.batch([
        // 增加用户积分
        {
          sql: 'UPDATE users SET credits = credits + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          args: [creditsAwarded, userId]
        },
        // 记录签到
        {
          sql: 'INSERT INTO user_checkins (user_id, checkin_type, checkin_period, credits_awarded) VALUES (?, ?, ?, ?)',
          args: [userId, checkinType, checkinPeriod, creditsAwarded]
        }
      ]);
      
      return {
        success: true,
        message: `签到成功，获得${creditsAwarded}积分`,
        creditsAwarded,
        checkinType
      };
    } catch (error) {
      console.error('用户签到失败:', error);
      return { success: false, message: '签到失败，请稍后重试' };
    }
  }

  // 检查签到状态
  static async getCheckinStatus(userId: number, userLevel: UserLevel): Promise<CheckinStatus> {
    const now = new Date();
    const isWeeklyUser = userLevel === 'free';
    const checkinType = isWeeklyUser ? 'weekly' : 'daily';
    
    let checkinPeriod: string;
    let nextCheckinTime: Date;
    
    if (isWeeklyUser) {
      const year = now.getFullYear();
      const week = this.getWeekNumber(now);
      checkinPeriod = `${year}-W${week.toString().padStart(2, '0')}`;
      // 下周同一时间
      nextCheckinTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else {
      checkinPeriod = now.toISOString().split('T')[0];
      // 明天同一时间
      nextCheckinTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
    
    try {
      const existingCheckin = await dbClient.execute({
        sql: 'SELECT id FROM user_checkins WHERE user_id = ? AND checkin_period = ?',
        args: [userId, checkinPeriod]
      });
      
      return {
        canCheckin: existingCheckin.rows.length === 0,
        nextCheckinTime: existingCheckin.rows.length > 0 ? nextCheckinTime : undefined,
        checkinType
      };
    } catch (error) {
      console.error('检查签到状态失败:', error);
      return { canCheckin: false, checkinType };
    }
  }

  // 获取用户签到历史
  static async getUserCheckinHistory(userId: number, limit: number = 30): Promise<UserCheckin[]> {
    try {
      const result = await dbClient.execute({
        sql: 'SELECT * FROM user_checkins WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
        args: [userId, limit]
      });
      
      return result.rows.map(row => {
        const rowData = row as Record<string, unknown>;
        return {
          id: rowData.id as number,
          user_id: rowData.user_id as number,
          checkin_type: rowData.checkin_type as 'daily' | 'weekly',
          checkin_period: rowData.checkin_period as string,
          credits_awarded: rowData.credits_awarded as number,
          created_at: new Date(rowData.created_at as string)
        };
      });
    } catch (error) {
      console.error('获取签到历史失败:', error);
      return [];
    }
  }

  // 积分充值（线下交易）
  static async purchaseCredits(
    userId: number,
    packageName: string,
    adminNote?: string
  ): Promise<PurchaseResult> {
    const packageInfo = this.CREDIT_PACKAGES.find(pkg => pkg.name === packageName);
    if (!packageInfo) {
      return { success: false, message: '积分包不存在' };
    }
    
    try {
      // 开始事务：增加积分 + 升级用户等级 + 记录交易
      await dbClient.batch([
        // 增加用户积分
        {
          sql: 'UPDATE users SET credits = credits + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          args: [packageInfo.totalCredits, userId]
        },
        // 升级用户等级为Pro
        {
          sql: 'UPDATE users SET user_level = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          args: ['pro', userId]
        },
        // 记录充值交易
        {
          sql: `INSERT INTO credit_purchases 
                (user_id, package_name, package_price, base_credits, bonus_credits, total_credits, admin_note) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
          args: [
            userId, 
            packageInfo.name, 
            packageInfo.price, 
            packageInfo.baseCredits, 
            packageInfo.bonusCredits, 
            packageInfo.totalCredits, 
            adminNote || ''
          ]
        }
      ]);
      
      return {
        success: true,
        message: `充值成功！获得${packageInfo.totalCredits}积分，已升级为Pro用户`,
        creditsAdded: packageInfo.totalCredits,
        newUserLevel: 'pro'
      };
    } catch (error) {
      console.error('积分充值失败:', error);
      return { success: false, message: '充值失败，请联系管理员' };
    }
  }

  // 获取积分包列表
  static getCreditPackages(): CreditPackage[] {
    return this.CREDIT_PACKAGES;
  }

  // 获取用户充值历史
  static async getUserPurchaseHistory(userId: number, limit: number = 20): Promise<CreditPurchase[]> {
    try {
      const result = await dbClient.execute({
        sql: 'SELECT * FROM credit_purchases WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
        args: [userId, limit]
      });
      
      return result.rows.map(row => {
        const rowData = row as Record<string, unknown>;
        return {
          id: rowData.id as number,
          user_id: rowData.user_id as number,
          package_name: rowData.package_name as string,
          package_price: rowData.package_price as number,
          base_credits: rowData.base_credits as number,
          bonus_credits: rowData.bonus_credits as number,
          total_credits: rowData.total_credits as number,
          payment_method: rowData.payment_method as string,
          transaction_status: rowData.transaction_status as string,
          admin_note: rowData.admin_note as string,
          created_at: new Date(rowData.created_at as string)
        };
      });
    } catch (error) {
      console.error('获取充值历史失败:', error);
      return [];
    }
  }

  // 创建生成历史记录
  static async createGenerationHistory(
    userId: number,
    creditsUsed: number,
    clothingCount: number = 1,
    generationType: 'single' | 'batch' = 'single'
  ): Promise<GenerationHistory> {
    try {
      const result = await dbClient.execute({
        sql: `INSERT INTO generation_history (user_id, credits_used, clothing_count, generation_type, status) 
              VALUES (?, ?, ?, ?, 'pending') RETURNING *`,
        args: [userId, creditsUsed, clothingCount, generationType]
      });
      
      const record = result.rows[0] as Record<string, unknown>;
      return {
        id: record.id as number,
        user_id: record.user_id as number,
        credits_used: record.credits_used as number,
        clothing_count: record.clothing_count as number,
        generation_type: record.generation_type as 'single' | 'batch',
        status: record.status as 'pending' | 'processing' | 'completed' | 'failed',
        created_at: new Date(record.created_at as string)
      };
    } catch (error) {
      console.error('创建生成历史记录失败:', error);
      throw error;
    }
  }

  // 更新生成历史状态
  static async updateGenerationStatus(
    historyId: number,
    status: 'processing' | 'completed' | 'failed',
    errorMessage?: string,
    processingTime?: number
  ): Promise<GenerationHistory> {
    try {
      const updateFields: string[] = ['status = ?'];
      const updateValues: any[] = [status];
      
      if (status === 'completed' || status === 'failed') {
        updateFields.push('completed_at = CURRENT_TIMESTAMP');
      }
      
      if (errorMessage) {
        updateFields.push('error_message = ?');
        updateValues.push(errorMessage);
      }
      
      if (processingTime !== undefined) {
        updateFields.push('processing_time = ?');
        updateValues.push(processingTime);
      }
      
      updateValues.push(historyId);
      
      const result = await dbClient.execute({
        sql: `UPDATE generation_history SET ${updateFields.join(', ')} WHERE id = ? RETURNING *`,
        args: updateValues
      });
      
      if (result.rows.length === 0) {
        throw new Error('生成历史记录不存在');
      }
      
      const record = result.rows[0] as Record<string, unknown>;
      return {
        id: record.id,
        user_id: record.user_id,
        credits_used: record.credits_used,
        clothing_count: record.clothing_count,
        generation_type: record.generation_type,
        status: record.status,
        error_message: record.error_message,
        processing_time: record.processing_time,
        created_at: new Date(record.created_at),
        completed_at: record.completed_at ? new Date(record.completed_at) : undefined
      };
    } catch (error) {
      console.error('更新生成历史状态失败:', error);
      throw error;
    }
  }

  // 获取用户生成历史
  static async getUserGenerationHistory(userId: number, limit: number = 50): Promise<GenerationHistory[]> {
    try {
      const result = await dbClient.execute({
        sql: 'SELECT * FROM generation_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
        args: [userId, limit]
      });
      
      return result.rows.map(row => {
        const rowData = row as Record<string, unknown>;
        return {
          id: rowData.id as number,
          user_id: rowData.user_id as number,
          credits_used: rowData.credits_used as number,
          clothing_count: rowData.clothing_count as number,
          generation_type: rowData.generation_type as 'single' | 'batch',
          status: rowData.status as 'pending' | 'processing' | 'completed' | 'failed',
          error_message: rowData.error_message as string,
          processing_time: rowData.processing_time as number,
          created_at: new Date(rowData.created_at as string),
          completed_at: rowData.completed_at ? new Date(rowData.completed_at as string) : undefined
        };
      });
    } catch (error) {
      console.error('获取生成历史失败:', error);
      return [];
    }
  }

  // 获取用户积分统计
  static async getUserCreditStats(userId: number) {
    try {
      const [generationResult, checkinResult, purchaseResult] = await Promise.all([
        // 查询生成统计
        dbClient.execute({
          sql: `SELECT 
                  COUNT(*) as total_generations,
                  COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_generations,
                  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_generations,
                  SUM(credits_used) as total_credits_used
                FROM generation_history 
                WHERE user_id = ?`,
          args: [userId]
        }),
        // 查询签到统计
        dbClient.execute({
          sql: `SELECT 
                  COUNT(*) as total_checkins,
                  SUM(credits_awarded) as total_checkin_credits
                FROM user_checkins 
                WHERE user_id = ?`,
          args: [userId]
        }),
        // 查询充值统计
        dbClient.execute({
          sql: `SELECT 
                  COUNT(*) as total_purchases,
                  SUM(total_credits) as total_purchased_credits
                FROM credit_purchases 
                WHERE user_id = ?`,
          args: [userId]
        })
      ]);
      
      const genStats = generationResult.rows[0] as Record<string, unknown>;
      const checkinStats = checkinResult.rows[0] as Record<string, unknown>;
      const purchaseStats = purchaseResult.rows[0] as Record<string, unknown>;
      
      return {
        // 生成统计
        total_generations: (genStats.total_generations as number) || 0,
        successful_generations: (genStats.successful_generations as number) || 0,
        failed_generations: (genStats.failed_generations as number) || 0,
        total_credits_used: (genStats.total_credits_used as number) || 0,
        
        // 签到统计
        total_checkins: (checkinStats.total_checkins as number) || 0,
        total_checkin_credits: (checkinStats.total_checkin_credits as number) || 0,
        
        // 充值统计
        total_purchases: (purchaseStats.total_purchases as number) || 0,
        total_purchased_credits: (purchaseStats.total_purchased_credits as number) || 0
      };
    } catch (error) {
      console.error('获取用户积分统计失败:', error);
      return {
        total_generations: 0,
        successful_generations: 0,
        failed_generations: 0,
        total_credits_used: 0,
        total_checkins: 0,
        total_checkin_credits: 0,
        total_purchases: 0,
        total_purchased_credits: 0
      };
    }
  }
}