import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { CreditsDAO } from '@/lib/dao/credits-dao';
import { z } from 'zod';

// Note: Cannot use Edge Runtime due to getServerSession (NextAuth.js dependency)
// export const runtime = 'edge';

const purchaseSchema = z.object({
  packageName: z.string().min(1, '请选择积分包'),
  adminNote: z.string().optional()
});

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
    const body = await request.json();
    
    // 验证输入数据
    const validationResult = purchaseSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        message: '输入数据无效',
        errors: validationResult.error.issues
      }, { status: 400 });
    }
    
    const { packageName, adminNote } = validationResult.data;
    
    // 执行充值
    const result = await CreditsDAO.purchaseCredits(userId, packageName, adminNote);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        data: {
          creditsAdded: result.creditsAdded,
          newUserLevel: result.newUserLevel
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        message: result.message
      }, { status: 400 });
    }

  } catch (error) {
    console.error('积分充值失败:', error);
    
    return NextResponse.json({
      success: false,
      message: '充值失败，请稍后重试'
    }, { status: 500 });
  }
}

// 获取积分包列表
export async function GET(request: NextRequest) {
  try {
    const packages = CreditsDAO.getCreditPackages();
    
    return NextResponse.json({
      success: true,
      data: packages
    });

  } catch (error) {
    console.error('获取积分包列表失败:', error);
    
    return NextResponse.json({
      success: false,
      message: '获取积分包列表失败，请稍后重试'
    }, { status: 500 });
  }
}