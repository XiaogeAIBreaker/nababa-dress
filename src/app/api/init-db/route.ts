import { NextResponse } from 'next/server';
import { initializeDatabase, checkDatabaseTables, migrateToVipSystem } from '@/lib/init-db';

export const runtime = 'edge';

export async function POST() {
  try {
    // 先执行迁移，再初始化
    await migrateToVipSystem();
    await initializeDatabase();
    const tables = await checkDatabaseTables();
    
    return NextResponse.json({
      success: true,
      message: '数据库迁移和初始化成功',
      tables
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: '数据库初始化失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const tables = await checkDatabaseTables();
    
    return NextResponse.json({
      success: true,
      message: '数据库表状态检查',
      tables
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: '检查数据库表失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}