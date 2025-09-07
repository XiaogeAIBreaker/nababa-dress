import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { UserDAO } from '@/lib/dao/user-dao';
import { CreditsDAO } from '@/lib/dao/credits-dao';
import { z } from 'zod';

// Note: Cannot use Edge Runtime due to UserDAO bcrypt dependency
// export const runtime = 'edge';

const generateSchema = z.object({
  userImage: z.string().min(1, '请上传用户照片'),
  clothingImages: z.array(z.string()).min(1, '请至少上传一件服装图片'),
  generationType: z.enum(['single', 'batch']).default('single')
});

// APIcore AI 配置
const APICORE_AI_URL = 'https://kg-api.cloud/v1/chat/completions';
const APICORE_AI_KEY = process.env.APICORE_AI_KEY || 'sk-yUPD9rfqfCrhxVzwmadPNlR3dtQ67PqWshJVgYihz8EWWU8D';

// 换衣专业Prompt模板
const generateTryOnPrompt = (clothingCount = 1) => {
  const basePrompt = `请将用户照片中的人物换上新的服装，要求：
1. 保持人物的面部特征、发型、体型和姿态完全不变
2. 服装要自然贴合人物身形，考虑光影和褶皱效果  
3. 保持原照片的背景、光线和整体氛围
4. 生成真实感强的穿着效果，避免违和感
5. 确保服装的材质、颜色和细节准确还原`;

  const multiplePrompt = clothingCount > 1 ? 
    `\n6. 请为这一个人物分别生成穿着每件不同服装的效果图，每张图保持人物一致性` : '';
    
  return basePrompt + multiplePrompt;
};

// 调用APIcore AI接口
async function callApicoreAI(userImage: string, clothingImages: string[], retryCount = 0): Promise<string[]> {
  const prompt = generateTryOnPrompt(clothingImages.length);
  
  // 构建消息内容
  const messageContent: any[] = [
    {
      type: 'text',
      text: prompt
    },
    {
      type: 'image_url',
      image_url: {
        url: userImage.startsWith('data:') ? userImage : `data:image/jpeg;base64,${userImage}`
      }
    }
  ];

  // 添加服装图片
  clothingImages.forEach(clothingImage => {
    messageContent.push({
      type: 'image_url',
      image_url: {
        url: clothingImage.startsWith('data:') ? clothingImage : `data:image/jpeg;base64,${clothingImage}`
      }
    });
  });

  const requestBody = {
    model: 'gemini-2.5-flash-image-preview',
    messages: [
      {
        role: 'user',
        content: messageContent
      }
    ],
    max_tokens: 500
  };

  try {
    console.log(`AI生成请求开始 (重试次数: ${retryCount})`);
    
    const response = await fetch(APICORE_AI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${APICORE_AI_KEY}`
      },
      body: JSON.stringify(requestBody),
      // 60秒超时
      signal: AbortSignal.timeout(60000)
    });

    if (!response.ok) {
      throw new Error(`API调用失败: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('AI生成响应:', result);

    if (!result.choices || !result.choices[0] || !result.choices[0].message) {
      throw new Error('API返回格式异常');
    }

    const content = result.choices[0].message.content;
    console.log('AI响应内容:', content);
    
    // 提取图片URL（支持多种格式）
    const matches = [];
    
    // 1. Markdown格式: ![image](url) 支持data:和http/https
    const markdownRegex = /!\[.*?\]\(((?:data:image\/[^;]+;base64,|https?:\/\/)[^\)]+)\)/g;
    let match;
    while ((match = markdownRegex.exec(content)) !== null) {
      matches.push(match[1]);
    }
    
    // 2. 直接data: URL格式
    if (matches.length === 0) {
      const dataUrlRegex = /(data:image\/[^;]+;base64,[A-Za-z0-9+/=]+)/g;
      while ((match = dataUrlRegex.exec(content)) !== null) {
        matches.push(match[1]);
      }
    }
    
    // 3. 直接HTTP/HTTPS URL格式
    if (matches.length === 0) {
      const directUrlRegex = /(https?:\/\/[^\s<>"{}|\\^`\[\]]+\.(png|jpg|jpeg|gif|webp))/gi;
      while ((match = directUrlRegex.exec(content)) !== null) {
        matches.push(match[1]);
      }
    }
    
    // 4. 任何以https://开头的URL
    if (matches.length === 0) {
      const anyUrlRegex = /(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/g;
      while ((match = anyUrlRegex.exec(content)) !== null) {
        matches.push(match[1]);
      }
    }

    if (matches.length === 0) {
      throw new Error('未从AI响应中提取到图片URL');
    }

    console.log(`成功生成 ${matches.length} 张图片`);
    return matches;

  } catch (error) {
    console.error(`AI生成失败 (重试次数: ${retryCount}):`, error);
    
    // 重试机制：失败后立即重试最多2次
    if (retryCount < 2) {
      console.log(`准备重试 ${retryCount + 1}/2`);
      return await callApicoreAI(userImage, clothingImages, retryCount + 1);
    }
    
    throw error;
  }
}

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
    const validationResult = generateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        message: '输入数据无效',
        errors: validationResult.error.issues
      }, { status: 400 });
    }
    
    const { userImage, clothingImages, generationType } = validationResult.data;
    
    // 获取用户信息
    const user = await UserDAO.findUserById(userId);
    if (!user) {
      return NextResponse.json({
        success: false,
        message: '用户不存在'
      }, { status: 404 });
    }

    // 检查用户等级权限
    const clothingCount = clothingImages.length;
    const userLevel = user.user_level;
    
    if (userLevel === 'free' && clothingCount > 1) {
      return NextResponse.json({
        success: false,
        message: 'Free用户只能上传1件服装图片，请升级到Plus或Pro'
      }, { status: 403 });
    }
    
    if (userLevel === 'plus' && clothingCount > 3) {
      return NextResponse.json({
        success: false,
        message: 'Plus用户最多上传3件服装图片，请升级到Pro'
      }, { status: 403 });
    }
    
    if (userLevel === 'pro' && clothingCount > 10) {
      return NextResponse.json({
        success: false,
        message: 'Pro用户最多上传10件服装图片'
      }, { status: 403 });
    }

    // 计算积分消耗
    const isBatchGeneration = clothingCount > 1 && userLevel === 'pro';
    const requiredCredits = isBatchGeneration ? 20 : 2;
    
    // 检查积分余额
    if (user.credits < requiredCredits) {
      return NextResponse.json({
        success: false,
        message: `积分不足，需要${requiredCredits}积分，当前余额${user.credits}积分`,
        requiredCredits,
        currentCredits: user.credits
      }, { status: 402 });
    }

    // 先扣除积分（失败时会退还）
    await UserDAO.updateUserCredits(userId, -requiredCredits);
    
    // 记录生成任务开始
    const generationRecord = await CreditsDAO.createGenerationHistory(
      userId,
      requiredCredits,
      clothingCount,
      isBatchGeneration ? 'batch' : 'single'
    );

    try {
      console.log(`开始AI生成：用户${userId}, 服装数量${clothingCount}, 类型${isBatchGeneration ? '批量' : '单次'}`);
      
      // 调用AI接口生成图片
      const resultImages = await callApicoreAI(userImage, clothingImages);
      
      // 更新生成记录为成功
      await CreditsDAO.updateGenerationStatus(generationRecord.id, 'completed');
      
      console.log(`AI生成成功：用户${userId}, 生成${resultImages.length}张图片`);
      
      return NextResponse.json({
        success: true,
        message: `生成成功！消耗${requiredCredits}积分`,
        data: {
          images: resultImages,
          creditsUsed: requiredCredits,
          generationType: isBatchGeneration ? 'batch' : 'single',
          generatedCount: resultImages.length
        }
      });

    } catch (error) {
      console.error('AI生成最终失败:', error);
      
      // 退还积分
      await UserDAO.updateUserCredits(userId, requiredCredits);
      
      // 更新生成记录为失败
      await CreditsDAO.updateGenerationStatus(generationRecord.id, 'failed', error instanceof Error ? error.message : '未知错误');
      
      return NextResponse.json({
        success: false,
        message: '生成失败，积分已退还。请稍后重试',
        error: error instanceof Error ? error.message : '未知错误'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('生成请求处理失败:', error);
    
    return NextResponse.json({
      success: false,
      message: '请求处理失败，请稍后重试'
    }, { status: 500 });
  }
}