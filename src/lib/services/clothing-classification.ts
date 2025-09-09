/**
 * 服装分类服务
 * 负责AI自动识别服装类别的业务逻辑
 */

import { AI_CONFIG } from '@/lib/config';

/**
 * 服装类别枚举
 */
export enum ClothingCategory {
  TOPS = '上衣',
  BOTTOMS = '下装',
  UNDERWEAR = '内衣',
  SHOES = '鞋子',
  ACCESSORIES = '配饰'
}

/**
 * 分类检测结果
 */
export interface ClassificationResult {
  category: ClothingCategory;
  confidence: number;
  rawResponse: string;
}

/**
 * 服装分类服务类
 */
export class ClothingClassificationService {
  
  /**
   * 分类识别提示词
   */
  private static readonly CLASSIFICATION_PROMPT = `分析这张图片中的服装/物品类型，只回答一个字母：

A - 上衣类（T恤、衬衫、背心、夹克、毛衣、外套等）
B - 下装类（裤子、裙子、短裤、长裤等）
C - 内衣类（文胸、内裤、连体内衣等）
D - 鞋子类（运动鞋、高跟鞋、靴子、凉鞋等）
E - 配饰类（帽子、包包、手表、眼镜、首饰等）

只回答：A 或 B 或 C 或 D 或 E`;

  /**
   * 答案到分类的映射
   */
  private static readonly ANSWER_TO_CATEGORY: Record<string, ClothingCategory> = {
    'A': ClothingCategory.TOPS,
    'B': ClothingCategory.BOTTOMS,
    'C': ClothingCategory.UNDERWEAR,
    'D': ClothingCategory.SHOES,
    'E': ClothingCategory.ACCESSORIES
  };

  /**
   * 分类特定的提示词映射
   */
  private static readonly CATEGORY_PROMPTS: Record<ClothingCategory, string> = {
    [ClothingCategory.TOPS]: '请将图中人物的上衣替换为参考图片中的衣服',
    [ClothingCategory.BOTTOMS]: '请将图中人物的裤子/裙子替换为参考图片中的下装',
    [ClothingCategory.UNDERWEAR]: '请将图中人物的内衣替换为参考图片中的内衣',
    [ClothingCategory.SHOES]: '请将图中人物的鞋子替换为参考图片中的鞋子',
    [ClothingCategory.ACCESSORIES]: '请为图中人物添加/替换参考图片中的配饰'
  };

  /**
   * 检测服装类别
   * @param clothingImage Base64编码的图片数据
   * @returns 分类结果
   */
  static async detectCategory(clothingImage: string): Promise<ClothingCategory> {
    try {
      console.log('开始服装类别检测...');
      
      const requestBody = {
        model: AI_CONFIG.model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: this.CLASSIFICATION_PROMPT },
              {
                type: 'image_url',
                image_url: {
                  url: clothingImage.startsWith('data:') 
                    ? clothingImage 
                    : `data:image/jpeg;base64,${clothingImage}`
                }
              }
            ]
          }
        ],
        temperature: AI_CONFIG.requestOptions.temperature
      };

      console.log('发送分类识别请求:', {
        model: requestBody.model,
        messageCount: requestBody.messages.length,
        hasImage: requestBody.messages[0].content.length > 1
      });

      const response = await fetch(AI_CONFIG.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_CONFIG.apiKey}`
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(30000)
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
      const answer = this.extractAnswer(rawAnswer);
      console.log('提取的答案:', answer);

      const detectedCategory = this.ANSWER_TO_CATEGORY[answer];
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
  }

  /**
   * 从AI回答中提取答案
   * @param content AI回答内容
   * @returns 提取的答案字母
   */
  private static extractAnswer(content: string): string {
    const trimmedContent = content.trim().toUpperCase();
    
    // 直接匹配字母
    if (['A', 'B', 'C', 'D', 'E'].includes(trimmedContent)) {
      return trimmedContent;
    }
    
    // 从文本中提取字母
    const match = trimmedContent.match(/[ABCDE]/);
    return match ? match[0] : '';
  }

  /**
   * 根据分类生成对应的提示词
   * @param category 服装分类
   * @returns 分类特定的提示词
   */
  static getCategoryPrompt(category: ClothingCategory): string {
    const basePrompt = this.CATEGORY_PROMPTS[category];
    return `${basePrompt}。严格按照参考图片的款式、颜色、版型进行替换，确保自然贴合，保持人物原有的姿态和特征。`;
  }

  /**
   * 获取所有支持的分类
   * @returns 分类数组
   */
  static getAllCategories(): ClothingCategory[] {
    return Object.values(ClothingCategory);
  }

  /**
   * 检查分类是否有效
   * @param category 要检查的分类
   * @returns 是否有效
   */
  static isValidCategory(category: string): category is ClothingCategory {
    return Object.values(ClothingCategory).includes(category as ClothingCategory);
  }
}