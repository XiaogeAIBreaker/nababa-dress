import { dbClient } from '../db';
import { hashPassword, verifyPassword, isBcryptHash } from '../crypto-edge';

export interface User {
  id: number;
  email: string;
  password_hash: string;
  user_level: 'free' | 'plus' | 'pro';
  credits: number;
  wechat_upgraded: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserInput {
  email: string;
  password: string;
}

export interface UpdateUserInput {
  user_level?: 'free' | 'plus' | 'pro';
  credits?: number;
  wechat_upgraded?: boolean;
}

export class UserDAO {
  
  // 创建新用户
  static async createUser(input: CreateUserInput): Promise<User> {
    const { email, password } = input;
    
    // 检查邮箱是否已存在
    const existingUser = await this.findUserByEmail(email);
    if (existingUser) {
      throw new Error('邮箱已被注册');
    }
    
    // 加密密码
    const password_hash = await hashPassword(password);
    
    const result = await dbClient.execute({
      sql: `INSERT INTO users (email, password_hash, user_level, credits) 
            VALUES (?, ?, ?, ?) RETURNING *`,
      args: [email, password_hash, 'free', 6]
    });
    
    const user = result.rows[0] as any;
    return {
      id: user.id,
      email: user.email,
      password_hash: user.password_hash,
      user_level: user.user_level,
      credits: user.credits,
      wechat_upgraded: Boolean(user.wechat_upgraded),
      created_at: new Date(user.created_at),
      updated_at: new Date(user.updated_at)
    };
  }
  
  // 根据邮箱查找用户
  static async findUserByEmail(email: string): Promise<User | null> {
    const result = await dbClient.execute({
      sql: 'SELECT * FROM users WHERE email = ?',
      args: [email]
    });
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const user = result.rows[0] as any;
    return {
      id: user.id,
      email: user.email,
      password_hash: user.password_hash,
      user_level: user.user_level,
      credits: user.credits,
      wechat_upgraded: Boolean(user.wechat_upgraded),
      created_at: new Date(user.created_at),
      updated_at: new Date(user.updated_at)
    };
  }
  
  // 根据ID查找用户
  static async findUserById(id: number): Promise<User | null> {
    const result = await dbClient.execute({
      sql: 'SELECT * FROM users WHERE id = ?',
      args: [id]
    });
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const user = result.rows[0] as any;
    return {
      id: user.id,
      email: user.email,
      password_hash: user.password_hash,
      user_level: user.user_level,
      credits: user.credits,
      wechat_upgraded: Boolean(user.wechat_upgraded),
      created_at: new Date(user.created_at),
      updated_at: new Date(user.updated_at)
    };
  }
  
  // 验证密码
  static async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    // Support both old bcrypt hashes and new Web Crypto API hashes
    if (isBcryptHash(hashedPassword)) {
      // For bcrypt hashes, we need to migrate them to Web Crypto API format
      console.warn('Bcrypt hash detected - needs migration to Web Crypto API format');
      return false; // Force password reset for old users
    }
    
    return await verifyPassword(plainPassword, hashedPassword);
  }
  
  // 为旧用户更新密码到新格式
  static async migrateUserPassword(userId: number, plainPassword: string): Promise<User> {
    const newHashedPassword = await hashPassword(plainPassword);
    
    const result = await dbClient.execute({
      sql: 'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING *',
      args: [newHashedPassword, userId]
    });
    
    if (result.rows.length === 0) {
      throw new Error('用户不存在');
    }
    
    const user = result.rows[0] as any;
    return {
      id: user.id,
      email: user.email,
      password_hash: user.password_hash,
      user_level: user.user_level,
      credits: user.credits,
      wechat_upgraded: Boolean(user.wechat_upgraded),
      created_at: new Date(user.created_at),
      updated_at: new Date(user.updated_at)
    };
  }
  
  // 更新用户信息
  static async updateUser(userId: number, input: UpdateUserInput): Promise<User> {
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    
    if (input.user_level !== undefined) {
      updateFields.push('user_level = ?');
      updateValues.push(input.user_level);
    }
    
    if (input.credits !== undefined) {
      updateFields.push('credits = ?');
      updateValues.push(input.credits);
    }
    
    if (input.wechat_upgraded !== undefined) {
      updateFields.push('wechat_upgraded = ?');
      updateValues.push(input.wechat_upgraded);
    }
    
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(userId);
    
    const sql = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ? RETURNING *`;
    
    const result = await dbClient.execute({
      sql,
      args: updateValues
    });
    
    if (result.rows.length === 0) {
      throw new Error('用户不存在');
    }
    
    const user = result.rows[0] as any;
    return {
      id: user.id,
      email: user.email,
      password_hash: user.password_hash,
      user_level: user.user_level,
      credits: user.credits,
      wechat_upgraded: Boolean(user.wechat_upgraded),
      created_at: new Date(user.created_at),
      updated_at: new Date(user.updated_at)
    };
  }
  
  // 扣除用户积分
  static async deductCredits(userId: number, creditsToDeduct: number): Promise<User> {
    // 先查询当前积分
    const user = await this.findUserById(userId);
    if (!user) {
      throw new Error('用户不存在');
    }
    
    if (user.credits < creditsToDeduct) {
      throw new Error('积分不足');
    }
    
    return await this.updateUser(userId, {
      credits: user.credits - creditsToDeduct
    });
  }
  
  // 增加用户积分
  static async addCredits(userId: number, creditsToAdd: number): Promise<User> {
    const user = await this.findUserById(userId);
    if (!user) {
      throw new Error('用户不存在');
    }
    
    return await this.updateUser(userId, {
      credits: user.credits + creditsToAdd
    });
  }
  
  // 更新用户积分（可正可负）
  static async updateUserCredits(userId: number, creditsDelta: number): Promise<User> {
    const user = await this.findUserById(userId);
    if (!user) {
      throw new Error('用户不存在');
    }
    
    const newCredits = user.credits + creditsDelta;
    if (newCredits < 0) {
      throw new Error('积分不足');
    }
    
    return await this.updateUser(userId, {
      credits: newCredits
    });
  }
  
  // 检查用户等级
  static async getUserLevel(userId: number): Promise<'free' | 'plus' | 'pro' | null> {
    const user = await this.findUserById(userId);
    return user ? user.user_level : null;
  }
  
  // 检查用户是否为Plus或Pro用户
  static async isPremiumUser(userId: number): Promise<boolean> {
    const user = await this.findUserById(userId);
    return user ? (user.user_level === 'plus' || user.user_level === 'pro') : false;
  }
  
  // 检查用户是否为Pro用户
  static async isProUser(userId: number): Promise<boolean> {
    const user = await this.findUserById(userId);
    return user ? user.user_level === 'pro' : false;
  }
  
  // 微信升级用户为Plus
  static async upgradeToPlusUser(userId: number): Promise<User> {
    return await this.updateUser(userId, {
      user_level: 'plus',
      wechat_upgraded: true
    });
  }
  
  // 购买积分包升级用户为Pro
  static async upgradeToProUser(userId: number): Promise<User> {
    return await this.updateUser(userId, {
      user_level: 'pro'
    });
  }
  
  // 获取用户统计信息
  static async getUserStats(userId: number) {
    const [generationResult, creditsResult] = await Promise.all([
      // 查询生成历史统计
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
      // 查询当前积分
      dbClient.execute({
        sql: 'SELECT credits FROM users WHERE id = ?',
        args: [userId]
      })
    ]);
    
    const stats = generationResult.rows[0] as any;
    const credits = creditsResult.rows[0] as any;
    
    return {
      total_generations: stats.total_generations || 0,
      successful_generations: stats.successful_generations || 0,
      failed_generations: stats.failed_generations || 0,
      total_credits_used: stats.total_credits_used || 0,
      current_credits: credits?.credits || 0
    };
  }
}