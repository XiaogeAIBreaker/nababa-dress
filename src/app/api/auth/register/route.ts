import { NextRequest, NextResponse } from 'next/server';
import { UserDAO } from '@/lib/dao/user-dao';
import { z } from 'zod';

// Note: UserDAO creates users, but registration doesn't need NextAuth session
// Should work with Edge Runtime now that we use Web Crypto API
export const runtime = 'edge';

const registerSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少6个字符'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: '两次输入的密码不一致',
  path: ['confirmPassword']
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 验证输入数据
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        message: '输入数据无效',
        errors: validationResult.error.issues
      }, { status: 400 });
    }
    
    const { email, password } = validationResult.data;
    
    // 创建用户
    const user = await UserDAO.createUser({
      email,
      password
    });
    
    return NextResponse.json({
      success: true,
      message: '注册成功',
      user: {
        id: user.id,
        email: user.email,
        credits: user.credits,
        user_level: user.user_level
      }
    });
    
  } catch (error) {
    console.error('注册失败:', error);
    
    if (error instanceof Error) {
      return NextResponse.json({
        success: false,
        message: error.message
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      message: '注册失败，请稍后重试'
    }, { status: 500 });
  }
}