import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { CreditsDAO } from '@/lib/dao/credits-dao';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 检查用户是否登录
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        message: '请先登录'
      }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    
    // 获取用户积分统计
    const stats = await CreditsDAO.getUserCreditStats(userId);
    
    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('获取用户统计失败:', error);
    
    return NextResponse.json({
      success: false,
      message: '获取统计数据失败，请稍后重试'
    }, { status: 500 });
  }
}