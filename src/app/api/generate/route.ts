export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { UserDAO } from '@/lib/dao/user-dao';
import { CreditsDAO } from '@/lib/dao/credits-dao';
import { z } from 'zod';

const generateSchema = z.object({
  userImage: z.string().min(1, '请上传用户照片'),
  clothingImages: z.array(z.string()).min(1, '请至少上传一件服装图片'),
  generationType: z.enum(['single', 'batch']).default('single')
});

// APIcore AI 配置
const APICORE_AI_URL = 'https://kg-api.cloud/v1/chat/completions';
const APICORE_AI_KEY = process.env.APICORE_AI_KEY || 'sk-yUPD9rfqfCrhxVzwmadPNlR3dtQ67PqWshJVgYihz8EWWU8D';

// 通用虚拟试衣系统提示词（固定部分）
const SYSTEM_PROMPT = `图像生成：已启用。

你是专业的"虚拟试衣（VTON）引擎"。任务：以【第一张】人物照为底图，用【后续图片】中的服装/配饰作参考，完成【物品替换 + 材质/颜色/细节还原】的图像编辑。

### 绝对规则（按优先级执行）
1. **版型替换优先级（最高）**：以参考物品的版型/轮廓/形状为准，必须按目标物品的特征完全替换原有物品
2. **区域重建要求**：移除原有物品，对被遮挡的身体区域进行合理重建（包括皮肤纹理、肌肉线条、身体轮廓等）
3. **保持人物特征**：只保留人物的脸部/发型/体型/姿态和背景，完全替换指定的服装/配饰
4. **材质颜色还原**：颜色、材质、图案要与参考物品精确一致
5. **自然贴合效果**：替换物品需与人物姿态自然贴合，考虑光影、褶皱、投影等真实效果

### 严格禁止行为
- 严禁仅"改色/加字"或在原物品上覆盖贴图
- 严禁保留原物品的任何特征或细节
- 严禁改变人物脸型/发型/姿态/背景
- 严禁添加参考图片中没有的新图案或标识

### 核心行为规范
- 必须直接生成替换后的图片，禁止询问任何问题
- 禁止进入对话模式，直接处理提供的图片
- 不要解释，不要询问，直接生成替换效果

### 自检清单（输出前逐条核对）
- [ ] 替换物品的版型/形状与参考图完全一致
- [ ] 原有物品完全消失，相关身体区域自然重建
- [ ] 颜色/材质/图案与参考图精确一致
- [ ] 物品边缘与身体、头发、其他物品交界自然
- [ ] 光影方向、强度与原图保持一致

### 输出格式要求
直接输出替换后的图片，使用以下格式之一：
- ![替换效果](data:image/jpeg;base64,...)
- ![替换效果](https://...)  
- 或直接输出：data:image/jpeg;base64,...

立即生成图片，不要添加任何解释文字。`;

// 服装分类体系
enum ClothingCategory {
  TOPS = '上衣',
  BOTTOMS = '下装',
  UNDERWEAR = '内衣',
  SHOES = '鞋子',
  ACCESSORIES = '配饰'
}

// 服装类别检测（使用AI视觉识别）
const detectClothingCategory = async (clothingImage: string): Promise<ClothingCategory> => {
  try {
    const categoryPrompt = `分析这张图片中的服装/物品类型，只回答一个字母：

A - 上衣类（T恤、衬衫、背心、夹克、毛衣、外套等）
B - 下装类（裤子、裙子、短裤、长裤等）
C - 内衣类（文胸、内裤、连体内衣等）
D - 鞋子类（运动鞋、高跟鞋、靴子、凉鞋等）
E - 配饰类（帽子、包包、手表、眼镜、首饰等）

只回答：A 或 B 或 C 或 D 或 E`;

    console.log('开始服装类别检测...');
    
    const requestBody = {
      model: 'gemini-2.5-flash-image-preview',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: categoryPrompt },
            {
              type: 'image_url',
              image_url: {
                url: clothingImage.startsWith('data:') ? clothingImage : `data:image/jpeg;base64,${clothingImage}`
              }
            }
          ]
        }
      ],
      temperature: 0.1
    };

    console.log('发送分类识别请求:', {
      model: requestBody.model,
      messageCount: requestBody.messages.length,
      hasImage: requestBody.messages[0].content.length > 1
    });

    const response = await fetch(APICORE_AI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${APICORE_AI_KEY}`
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(30000) // 增加到30秒
    });

    console.log('API响应状态:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API调用失败:', response.status, errorText);
      throw new Error(`API调用失败: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('AI分类响应:', result);

    const rawAnswer = result.choices?.[0]?.message?.content;
    console.log('AI原始回答:', rawAnswer);

    if (!rawAnswer) {
      console.error('AI响应格式异常，无内容');
      throw new Error('AI响应格式异常');
    }

    // 提取答案 - 支持多种格式
    let answer = '';
    const content = rawAnswer.trim().toUpperCase();
    
    // 直接匹配字母
    if (['A', 'B', 'C', 'D', 'E'].includes(content)) {
      answer = content;
    }
    // 从文本中提取字母
    else {
      const match = content.match(/[ABCDE]/);
      answer = match ? match[0] : '';
    }

    console.log('提取的答案:', answer);

    // 根据AI回答映射到分类
    const categoryMap: Record<string, ClothingCategory> = {
      'A': ClothingCategory.TOPS,
      'B': ClothingCategory.BOTTOMS,
      'C': ClothingCategory.UNDERWEAR,
      'D': ClothingCategory.SHOES,
      'E': ClothingCategory.ACCESSORIES
    };

    const detectedCategory = categoryMap[answer];
    console.log('映射的分类:', detectedCategory);

    if (detectedCategory) {
      return detectedCategory;
    } else {
      console.warn(`无法识别答案"${answer}"，使用默认分类`);
      return ClothingCategory.TOPS;
    }

  } catch (error) {
    console.error('服装分类检测失败:', error);
    return ClothingCategory.TOPS; // 默认为上衣
  }
};

// 根据分类生成对应的提示词
const getCategoryPrompt = (category: ClothingCategory) => {
  const prompts: Record<ClothingCategory, string> = {
    [ClothingCategory.TOPS]: '请将图中人物的上衣替换为参考图片中的衣服',
    [ClothingCategory.BOTTOMS]: '请将图中人物的裤子/裙子替换为参考图片中的下装',
    [ClothingCategory.UNDERWEAR]: '请将图中人物的内衣替换为参考图片中的内衣',
    [ClothingCategory.SHOES]: '请将图中人物的鞋子替换为参考图片中的鞋子',
    [ClothingCategory.ACCESSORIES]: '请为图中人物添加/替换参考图片中的配饰'
  };
  
  return `${prompts[category]}。严格按照参考图片的款式、颜色、版型进行替换，确保自然贴合，保持人物原有的姿态和特征。`;
};

// 用户任务提示词（动态部分）
const generateUserPrompt = (category: ClothingCategory, clothingCount = 1, retryCount = 0, lastFailureReason = '') => {
  const categoryPrompt = getCategoryPrompt(category);
  
  let taskPrompt = `${categoryPrompt}

### 任务目标
- 底图：第一张人物照
- 参考物品：第二张${clothingCount > 1 ? `到第${clothingCount + 1}张（分别生成每件的替换效果图）` : '图片'}
- 版型优先：严格按照参考图的版型/形状/尺寸进行替换
- 替换要求：必须以目标物品为准进行**完整替换**，禁止仅更改颜色或保留原有特征

### 必须执行
1. **移除原有物品**：完全移除原有物品的所有特征，不保留任何痕迹
2. **重建相关区域**：对被原物品遮挡的身体区域进行自然重建（皮肤纹理、身体轮廓等）
3. **贴合与光影**：替换物品与身体自然贴合，符合原图光源方向和阴影规律
4. **细节一致**：颜色、材质、图案、纹理均与参考物品精确一致，不得新增额外元素
5. **保持人物特征**：人物脸部/发型/体型/姿态和背景保持完全不变

### 严格禁止
- 禁止只改变颜色或在原物品上覆盖贴图
- 禁止保留原物品的任何特征或细节
- 禁止改变人物脸型/发型/姿态/背景
- 禁止添加参考图中没有的新图案或标识`;

  // 重试时添加失败原因说明
  if (retryCount > 0 && lastFailureReason) {
    taskPrompt += `\n\n### ⚠️ 重要提醒（第${retryCount + 1}次尝试）\n上一次输出不合格：${lastFailureReason}。请严格按照要求重新生成，确保替换效果完全正确。`;
  }

  taskPrompt += '\n\n请直接输出最终图片（data:image/... 或 https 链接），不要附加任何说明文字。';

  return taskPrompt;
};

// 调用APIcore AI接口
async function callApicoreAI(userImage: string, clothingImages: string[], retryCount = 0, lastFailureReason = ''): Promise<string[]> {
  // 检测第一张服装图片的类别
  const detectedCategory = await detectClothingCategory(clothingImages[0]);
  console.log(`检测到服装类别: ${detectedCategory}`);
  
  const userPrompt = generateUserPrompt(detectedCategory, clothingImages.length, retryCount, lastFailureReason);
  
  // 构建用户消息内容（包含任务描述和图片）
  const userMessageContent: any[] = [
    {
      type: 'text',
      text: userPrompt
    },
    {
      type: 'image_url',
      image_url: {
        url: userImage.startsWith('data:') ? userImage : `data:image/jpeg;base64,${userImage}`
      }
    }
  ];

  // 添加服装图片到用户消息
  clothingImages.forEach(clothingImage => {
    userMessageContent.push({
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
        role: 'system',
        content: SYSTEM_PROMPT
      },
      {
        role: 'user',
        content: userMessageContent
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
    
    // 提取图片URL（支持多种格式，按优先级依次尝试）
    const matches = [];
    let match;
    
    // 1. Markdown格式: ![image](url) - 最标准的格式
    const markdownRegex = /!\[.*?\]\(((?:data:image\/[^;]+;base64,|https?:\/\/)[^\)]+)\)/g;
    while ((match = markdownRegex.exec(content)) !== null) {
      matches.push(match[1]);
    }
    
    // 2. 直接data URL格式: data:image/jpeg;base64,... 
    if (matches.length === 0) {
      const dataUrlRegex = /(data:image\/[^;]+;base64,[A-Za-z0-9+\/=]+)/g;
      while ((match = dataUrlRegex.exec(content)) !== null) {
        matches.push(match[1]);
      }
    }
    
    // 3. 常见图片URL格式（带文件扩展名）
    if (matches.length === 0) {
      const imageUrlRegex = /(https?:\/\/[^\s<>"{}|\\^`\[\]]+\.(png|jpg|jpeg|gif|webp|bmp|svg))/gi;
      while ((match = imageUrlRegex.exec(content)) !== null) {
        matches.push(match[1]);
      }
    }
    
    // 4. 纯base64字符串（可能没有data:前缀）
    if (matches.length === 0) {
      const base64Regex = /^([A-Za-z0-9+\/=]{100,})$/gm; // 至少100字符的base64
      while ((match = base64Regex.exec(content)) !== null) {
        // 添加data URL前缀
        matches.push(`data:image/jpeg;base64,${match[1]}`);
      }
    }
    
    // 5. 任何HTTPS链接（较宽泛的匹配）
    if (matches.length === 0) {
      const anyHttpsRegex = /(https:\/\/[^\s<>"{}|\\^`\[\]]+)/g;
      while ((match = anyHttpsRegex.exec(content)) !== null) {
        matches.push(match[1]);
      }
    }
    
    // 6. 特殊情况：如果内容很短且像是一个URL
    if (matches.length === 0 && content.length < 500) {
      const cleanContent = content.trim();
      if (cleanContent.startsWith('http') || cleanContent.startsWith('data:image')) {
        matches.push(cleanContent);
      }
    }

    if (matches.length === 0) {
      throw new Error('未从AI响应中提取到图片URL');
    }

    console.log(`成功生成 ${matches.length} 张图片`);
    return matches;

  } catch (error) {
    console.error(`AI生成失败 (重试次数: ${retryCount}):`, error);
    
    // 重试机制：失败后立即重试最多2次，传递具体失败原因
    if (retryCount < 2) {
      const failureReason = error instanceof Error ? 
        (error.message.includes('袖子') ? '保留了袖子/图案' : 
         error.message.includes('颜色') ? '只改变了颜色而非版型' : 
         '未按要求生成') : '未按要求生成';
      
      console.log(`准备重试 ${retryCount + 1}/2，失败原因: ${failureReason}`);
      return await callApicoreAI(userImage, clothingImages, retryCount + 1, failureReason);
    }
    
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    // 检查用户是否登录
    const session = await auth();
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