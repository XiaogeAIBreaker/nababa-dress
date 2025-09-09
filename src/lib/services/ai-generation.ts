/**
 * AI生成服务
 * 
 * 处理虚拟试衣的核心业务逻辑，包括：
 * - AI图片生成请求处理
 * - 服装分类检测集成
 * - 重试机制和错误处理
 * - 图片URL提取和验证
 * 
 * 该服务负责与外部AI API（APIcore）的交互，
 * 将用户图片和服装图片合成为虚拟试衣效果图。
 * 
 * @example
 * ```typescript
 * // 基本使用
 * const request: GenerationRequest = {
 *   userImage: 'data:image/jpeg;base64,...',
 *   clothingImages: ['data:image/jpeg;base64,...'],
 *   generationType: 'single'
 * };
 * 
 * const images = await AIGenerationService.generateWithRetry(request);
 * console.log(`生成了 ${images.length} 张图片`);
 * ```
 */

import { AI_CONFIG } from '@/lib/config';
import { ClothingCategory, ClothingClassificationService } from './clothing-classification';
import { ErrorFactory, AIAPIError, ErrorHandler } from '@/lib/errors';
import type { GenerationRequest, GenerationResult, UserLevel } from '@/types';

/**
 * AI生成服务选项
 */
interface GenerationOptions {
  retryCount?: number;
  lastFailureReason?: string;
}

/**
 * AI生成服务类
 */
export class AIGenerationService {

  /**
   * 通用虚拟试衣系统提示词（固定部分）
   */
  private static readonly SYSTEM_PROMPT = `图像生成：已启用。

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

  /**
   * 生成虚拟试衣图片
   * @param request 生成请求
   * @param options 生成选项
   * @returns 生成结果
   */
  static async generateImages(
    request: GenerationRequest,
    options: GenerationOptions = {}
  ): Promise<string[]> {
    const { userImage, clothingImages } = request;
    const { retryCount = 0, lastFailureReason = '' } = options;

    return ErrorHandler.withErrorHandling(async () => {
      // 检测第一张服装图片的类别
      const detectedCategory = await ClothingClassificationService.detectCategory(clothingImages[0]);
      console.log(`检测到服装类别: ${detectedCategory}`);
      
      const userPrompt = this.generateUserPrompt(
        detectedCategory, 
        clothingImages.length, 
        retryCount, 
        lastFailureReason
      );
      
      // 构建用户消息内容（包含任务描述和图片）
      const userMessageContent = this.buildUserMessageContent(userPrompt, userImage, clothingImages);

      const requestBody = {
        model: AI_CONFIG.model,
        messages: [
          {
            role: 'system',
            content: this.SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: userMessageContent
          }
        ],
        max_tokens: AI_CONFIG.requestOptions.maxTokens
      };

      console.log(`AI生成请求开始 (重试次数: ${retryCount})`);
      
      const response = await fetch(AI_CONFIG.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_CONFIG.apiKey}`
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(AI_CONFIG.timeout)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw ErrorFactory.aiApiError(`API调用失败: ${response.status} ${response.statusText}`, errorText);
      }

      const result = await response.json();
      console.log('AI生成响应:', result);

      if (!result.choices?.[0]?.message) {
        throw ErrorFactory.aiApiError('API返回格式异常', result);
      }

      const content = result.choices[0].message.content;
      console.log('AI响应内容:', content);
      
      // 提取图片URL
      const imageUrls = this.extractImageUrls(content);

      if (imageUrls.length === 0) {
        throw ErrorFactory.aiApiError('未从AI响应中提取到图片URL', content);
      }

      console.log(`成功生成 ${imageUrls.length} 张图片`);
      return imageUrls;

    }, 'AI图片生成');
  }

  /**
   * 带重试机制的AI图片生成
   * 
   * 这是推荐的生成方法，内置了完整的重试机制和错误处理。
   * 当AI生成失败时，会自动重试最多2次，并在最终失败时提供详细错误信息。
   * 
   * @param request - AI生成请求对象
   * @param request.userImage - 用户照片（Base64格式）
   * @param request.clothingImages - 服装图片数组（Base64格式）
   * @param request.generationType - 生成类型（single或batch）
   * 
   * @returns Promise<string[]> 生成的图片URL数组（Base64或HTTP链接）
   * 
   * @throws {AIAPIError} 当AI API调用失败时
   * @throws {Error} 当图片提取失败或其他系统错误时
   * 
   * @example
   * ```typescript
   * try {
   *   const images = await AIGenerationService.generateWithRetry({
   *     userImage: 'data:image/jpeg;base64,/9j/4AAQ...',
   *     clothingImages: ['data:image/jpeg;base64,iVBOR...'],
   *     generationType: 'single'
   *   });
   *   
   *   console.log(`成功生成 ${images.length} 张图片`);
   *   images.forEach((url, index) => {
   *     console.log(`图片 ${index + 1}: ${url.substring(0, 50)}...`);
   *   });
   * } catch (error) {
   *   console.error('生成失败:', error.message);
   * }
   * ```
   */
  static async generateWithRetry(request: GenerationRequest): Promise<string[]> {
    let lastError: Error | null = null;

    for (let retryCount = 0; retryCount <= AI_CONFIG.maxRetries; retryCount++) {
      try {
        const failureReason = this.getFailureReason(lastError);
        return await this.generateImages(request, { retryCount, lastFailureReason: failureReason });
      } catch (error) {
        lastError = error as Error;
        console.error(`AI生成失败 (重试次数: ${retryCount}):`, error);
        
        // 如果是最后一次重试，抛出错误
        if (retryCount >= AI_CONFIG.maxRetries) {
          throw error;
        }
        
        console.log(`准备重试 ${retryCount + 1}/${AI_CONFIG.maxRetries}`);
      }
    }

    // 这行代码理论上不会执行，但为了类型安全
    throw lastError || ErrorFactory.aiApiError('生成失败');
  }

  /**
   * 生成用户任务提示词（动态部分）
   */
  private static generateUserPrompt(
    category: ClothingCategory, 
    clothingCount = 1, 
    retryCount = 0, 
    lastFailureReason = ''
  ): string {
    const categoryPrompt = ClothingClassificationService.getCategoryPrompt(category);
    
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
  }

  /**
   * 构建用户消息内容
   */
  private static buildUserMessageContent(
    userPrompt: string, 
    userImage: string, 
    clothingImages: string[]
  ): Array<{ type: string; text?: string; image_url?: { url: string } }> {
    const content = [
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
      content.push({
        type: 'image_url',
        image_url: {
          url: clothingImage.startsWith('data:') ? clothingImage : `data:image/jpeg;base64,${clothingImage}`
        }
      });
    });

    return content;
  }

  /**
   * 从AI响应中提取图片URL
   */
  private static extractImageUrls(content: string): string[] {
    const matches: string[] = [];
    let match: RegExpExecArray | null;
    
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

    return matches;
  }

  /**
   * 根据错误类型获取失败原因描述
   */
  private static getFailureReason(error: Error | null): string {
    if (!error) return '';
    
    const message = error.message;
    if (message.includes('袖子')) return '保留了袖子/图案';
    if (message.includes('颜色')) return '只改变了颜色而非版型';
    return '未按要求生成';
  }
}