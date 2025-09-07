import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { CreditsDAO } from '@/lib/dao/credits-dao';

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
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '30');
    
    let data;
    
    switch (type) {
      case 'checkin':
        data = await CreditsDAO.getUserCheckinHistory(userId, limit);
        break;
      case 'purchase':
        data = await CreditsDAO.getUserPurchaseHistory(userId, limit);
        break;
      case 'generation':
        data = await CreditsDAO.getUserGenerationHistory(userId, limit);
        break;
      default:
        return NextResponse.json({
          success: false,
          message: '无效的历史类型，支持: checkin, purchase, generation'
        }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('获取用户历史失败:', error);
    
    return NextResponse.json({
      success: false,
      message: '获取历史数据失败，请稍后重试'
    }, { status: 500 });
  }
}