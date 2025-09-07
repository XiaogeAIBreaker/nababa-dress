import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { CreditsDAO } from '@/lib/dao/credits-dao';
import { UserDAO } from '@/lib/dao/user-dao';

// Note: Cannot use Edge Runtime due to UserDAO bcrypt dependency
// export const runtime = 'edge';

export async function POST(request: NextRequest) {
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
    
    // 获取用户等级
    const userLevel = await UserDAO.getUserLevel(userId);
    if (!userLevel) {
      return NextResponse.json({
        success: false,
        message: '用户不存在'
      }, { status: 404 });
    }

    // 执行签到
    const result = await CreditsDAO.userCheckin(userId, userLevel);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        data: {
          creditsAwarded: result.creditsAwarded,
          checkinType: result.checkinType
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        message: result.message
      }, { status: 400 });
    }

  } catch (error) {
    console.error('签到失败:', error);
    
    return NextResponse.json({
      success: false,
      message: '签到失败，请稍后重试'
    }, { status: 500 });
  }
}

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
    
    // 获取用户等级
    const userLevel = await UserDAO.getUserLevel(userId);
    if (!userLevel) {
      return NextResponse.json({
        success: false,
        message: '用户不存在'
      }, { status: 404 });
    }

    // 获取签到状态
    const status = await CreditsDAO.getCheckinStatus(userId, userLevel);
    
    return NextResponse.json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('获取签到状态失败:', error);
    
    return NextResponse.json({
      success: false,
      message: '获取签到状态失败，请稍后重试'
    }, { status: 500 });
  }
}