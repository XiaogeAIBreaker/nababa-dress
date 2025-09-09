import { dbClient } from '../db';
import { hashPassword, verifyPassword, isBcryptHash } from '../crypto-edge';
import type { User, CreateUserInput, UpdateUserInput, UserLevel } from '@/types';

/**
 * 用户数据访问对象
 * 
 * 负责用户相关的数据库操作，包括：
 * - 用户创建、查询、更新
 * - 密码验证和迁移
 * - 积分管理
 * - 用户等级管理
 * - 统计信息获取
 * 
 * @example
 * ```typescript
 * // 创建新用户
 * const user = await UserDAO.createUser({
 *   email: 'user@example.com',
 *   password: 'password123'
 * });
 * 
 * // 查询用户
 * const user = await UserDAO.findUserById(1);
 * 
 * // 更新积分
 * await UserDAO.updateUserCredits(userId, 10);
 * ```
 */
export class UserDAO {
  
  /**
   * 创建新用户
   * 
   * 创建新用户账户，包括邮箱唯一性检查、密码加密、初始积分设置
   * 
   * @param input - 用户创建信息
   * @param input.email - 用户邮箱（必须唯一）
   * @param input.password - 用户密码（将被加密存储）
   * @returns Promise<User> 创建的用户信息
   * 
   * @throws {Error} 当邮箱已被注册时抛出错误
   * 
   * @example
   * ```typescript
   * const newUser = await UserDAO.createUser({
   *   email: 'newuser@example.com',
   *   password: 'securepassword123'
   * });
   * console.log(`Created user with ID: ${newUser.id}`);
   * ```
   */
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
    
    const userData = result.rows[0] as Record<string, unknown>;
    return {
      id: userData.id as number,
      email: userData.email as string,
      password_hash: userData.password_hash as string,
      user_level: userData.user_level as UserLevel,
      credits: userData.credits as number,
      wechat_upgraded: Boolean(userData.wechat_upgraded),
      created_at: new Date(userData.created_at as string),
      updated_at: new Date(userData.updated_at as string)
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
    
    const userData = result.rows[0] as Record<string, unknown>;
    return {
      id: userData.id as number,
      email: userData.email as string,
      password_hash: userData.password_hash as string,
      user_level: userData.user_level as UserLevel,
      credits: userData.credits as number,
      wechat_upgraded: Boolean(userData.wechat_upgraded),
      created_at: new Date(userData.created_at as string),
      updated_at: new Date(userData.updated_at as string)
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
    
    const userData = result.rows[0] as Record<string, unknown>;
    return {
      id: userData.id as number,
      email: userData.email as string,
      password_hash: userData.password_hash as string,
      user_level: userData.user_level as UserLevel,
      credits: userData.credits as number,
      wechat_upgraded: Boolean(userData.wechat_upgraded),
      created_at: new Date(userData.created_at as string),
      updated_at: new Date(userData.updated_at as string)
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
    
    const userData = result.rows[0] as Record<string, unknown>;
    return {
      id: userData.id as number,
      email: userData.email as string,
      password_hash: userData.password_hash as string,
      user_level: userData.user_level as UserLevel,
      credits: userData.credits as number,
      wechat_upgraded: Boolean(userData.wechat_upgraded),
      created_at: new Date(userData.created_at as string),
      updated_at: new Date(userData.updated_at as string)
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
    
    const userData = result.rows[0] as Record<string, unknown>;
    return {
      id: userData.id as number,
      email: userData.email as string,
      password_hash: userData.password_hash as string,
      user_level: userData.user_level as UserLevel,
      credits: userData.credits as number,
      wechat_upgraded: Boolean(userData.wechat_upgraded),
      created_at: new Date(userData.created_at as string),
      updated_at: new Date(userData.updated_at as string)
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
  
  /**
   * 更新用户积分
   * 
   * 增加或减少用户积分，支持正负值操作，包含余额验证
   * 
   * @param userId - 用户ID
   * @param creditsDelta - 积分变化量（正数为增加，负数为减少）
   * @returns Promise<User> 更新后的用户信息
   * 
   * @throws {Error} 当用户不存在或积分不足时抛出错误
   * 
   * @example
   * ```typescript
   * // 增加积分
   * await UserDAO.updateUserCredits(1, 10);
   * 
   * // 减少积分
   * await UserDAO.updateUserCredits(1, -5);
   * ```
   */
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
    
    const stats = generationResult.rows[0] as Record<string, unknown>;
    const credits = creditsResult.rows[0] as Record<string, unknown>;
    
    return {
      total_generations: (stats.total_generations as number) || 0,
      successful_generations: (stats.successful_generations as number) || 0,
      failed_generations: (stats.failed_generations as number) || 0,
      total_credits_used: (stats.total_credits_used as number) || 0,
      current_credits: (credits?.credits as number) || 0
    };
  }
}