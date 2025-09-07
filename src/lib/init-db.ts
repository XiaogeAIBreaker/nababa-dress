import { dbClient } from './db';

// Database schema embedded for Edge Runtime compatibility
const DB_SCHEMA = `-- 用户表（充值VIP制）
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  user_level TEXT DEFAULT 'free' CHECK (user_level IN ('free', 'plus', 'pro')), -- 充值VIP制等级
  credits INTEGER DEFAULT 6, -- 积分余额，新用户注册赠送6积分
  wechat_upgraded BOOLEAN DEFAULT FALSE, -- 是否通过微信升级Plus
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 签到记录表
CREATE TABLE IF NOT EXISTS user_checkins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  checkin_type TEXT CHECK (checkin_type IN ('daily', 'weekly')), -- 签到类型
  checkin_period TEXT NOT NULL, -- 签到周期标识：YYYY-MM-DD（日）或 YYYY-W##（周）
  credits_awarded INTEGER DEFAULT 6, -- 发放的积分数
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, checkin_period), -- 防止同一周期重复签到
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- 积分充值记录表
CREATE TABLE IF NOT EXISTS credit_purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  package_name TEXT NOT NULL, -- 积分包名称
  package_price DECIMAL(10,2) NOT NULL, -- 积分包价格
  base_credits INTEGER NOT NULL, -- 基础积分数
  bonus_credits INTEGER DEFAULT 0, -- 赠送积分数
  total_credits INTEGER NOT NULL, -- 总积分数
  payment_method TEXT DEFAULT 'wechat', -- 支付方式
  transaction_status TEXT DEFAULT 'completed', -- 交易状态
  admin_note TEXT, -- 管理员备注
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- 生成历史表（支持批量生成）
CREATE TABLE IF NOT EXISTS generation_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  credits_used INTEGER NOT NULL, -- 使用的积分数（整数化）
  clothing_count INTEGER DEFAULT 1, -- 生成的服装数量
  generation_type TEXT DEFAULT 'single' CHECK (generation_type IN ('single', 'batch')), -- 生成类型
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT, -- 失败时的错误信息
  processing_time INTEGER, -- 处理时间（秒）
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME, -- 完成时间
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- 用户会话表 (NextAuth.js 需要)
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  sessionToken TEXT NOT NULL UNIQUE,
  userId INTEGER NOT NULL,
  expires DATETIME NOT NULL,
  FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_level ON users(user_level);
CREATE INDEX IF NOT EXISTS idx_users_wechat ON users(wechat_upgraded);
CREATE INDEX IF NOT EXISTS idx_checkins_user ON user_checkins(user_id, checkin_period DESC);
CREATE INDEX IF NOT EXISTS idx_checkins_period ON user_checkins(checkin_period DESC);
CREATE INDEX IF NOT EXISTS idx_purchases_user ON credit_purchases(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON credit_purchases(transaction_status);
CREATE INDEX IF NOT EXISTS idx_generation_user ON generation_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generation_status ON generation_history(status, created_at);
CREATE INDEX IF NOT EXISTS idx_generation_type ON generation_history(generation_type, user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(sessionToken);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires);`;

export async function initializeDatabase() {
  try {
    const schema = DB_SCHEMA;
    
    // 将SQL语句按分号分割，过滤空语句
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    // 执行每个SQL语句
    for (const statement of statements) {
      if (statement.trim()) {
        await dbClient.execute(statement);
        console.log('执行SQL语句成功:', statement.substring(0, 50) + '...');
      }
    }
    
    console.log('数据库表初始化完成');
    return true;
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  }
}

// Migration script embedded for Edge Runtime compatibility
const MIGRATION_SQL = `-- 数据库迁移脚本：订阅制 → 充值VIP制
-- 警告：此脚本会删除现有数据，仅适用于开发环境

-- 1. 删除所有现有表和索引
DROP TABLE IF EXISTS generation_history;
DROP TABLE IF EXISTS daily_credits_log;
DROP TABLE IF EXISTS redemption_codes;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS users;

-- 2. 删除所有索引
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_subscription;
DROP INDEX IF EXISTS idx_redemption_code;
DROP INDEX IF EXISTS idx_redemption_used;
DROP INDEX IF EXISTS idx_generation_user;
DROP INDEX IF EXISTS idx_generation_status;
DROP INDEX IF EXISTS idx_daily_credits_date;
DROP INDEX IF EXISTS idx_daily_credits_user;
DROP INDEX IF EXISTS idx_sessions_token;
DROP INDEX IF EXISTS idx_sessions_expires;`;

export async function migrateToVipSystem() {
  try {
    const migration = MIGRATION_SQL;
    
    const statements = migration
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        await dbClient.execute(statement);
        console.log('执行迁移语句:', statement.substring(0, 50) + '...');
      }
    }
    
    console.log('数据库迁移完成');
    return true;
  } catch (error) {
    console.error('数据库迁移失败:', error);
    throw error;
  }
}

export async function checkDatabaseTables() {
  try {
    // 检查新的表结构是否存在
    const tableCheckQueries = [
      "SELECT name FROM sqlite_master WHERE type='table' AND name='users'",
      "SELECT name FROM sqlite_master WHERE type='table' AND name='user_checkins'", 
      "SELECT name FROM sqlite_master WHERE type='table' AND name='credit_purchases'",
      "SELECT name FROM sqlite_master WHERE type='table' AND name='generation_history'",
      "SELECT name FROM sqlite_master WHERE type='table' AND name='sessions'"
    ];
    
    const results = await Promise.all(
      tableCheckQueries.map(query => dbClient.execute(query))
    );
    
    const tableNames = ['users', 'user_checkins', 'credit_purchases', 'generation_history', 'sessions'];
    const existingTables = results.map((result, index) => ({
      name: tableNames[index],
      exists: result.rows.length > 0
    }));
    
    console.log('数据库表状态:', existingTables);
    return existingTables;
  } catch (error) {
    console.error('检查数据库表失败:', error);
    throw error;
  }
}