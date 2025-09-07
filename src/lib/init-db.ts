import { dbClient } from './db';
import fs from 'fs';
import path from 'path';

export async function initializeDatabase() {
  try {
    // 读取数据库架构文件
    const schemaPath = path.join(process.cwd(), 'src', 'lib', 'db-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
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

export async function migrateToVipSystem() {
  try {
    // 执行迁移脚本
    const migrationPath = path.join(process.cwd(), 'src', 'lib', 'migrate-to-vip.sql');
    const migration = fs.readFileSync(migrationPath, 'utf8');
    
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