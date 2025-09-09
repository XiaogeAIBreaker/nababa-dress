export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { UserDAO } from '@/lib/dao/user-dao';
import { CreditsDAO } from '@/lib/dao/credits-dao';
import { AIGenerationService } from '@/lib/services/ai-generation';
import { BUSINESS_CONFIG } from '@/lib/config';
import { 
  AppError, 
  ErrorHandler, 
  ErrorFactory, 
  UnauthorizedError,
  GenerationLimitExceededError,
  InsufficientCreditsError 
} from '@/lib/errors';
import { z } from 'zod';
import type { GenerationRequest, UserLevel } from '@/types';

const generateSchema = z.object({
  userImage: z.string().min(1, '请上传用户照片'),
  clothingImages: z.array(z.string()).min(1, '请至少上传一件服装图片'),
  generationType: z.enum(['single', 'batch']).default('single')
});

/**
 * 计算所需积分
 */
function calculateRequiredCredits(userLevel: UserLevel, clothingCount: number): number {
  const isBatchGeneration = clothingCount > 1 && userLevel === 'pro';
  return isBatchGeneration 
    ? BUSINESS_CONFIG.credits.batchGenerationCost 
    : BUSINESS_CONFIG.credits.singleGenerationCost;
}

/**
 * 验证用户权限
 */
function validateUserPermissions(userLevel: UserLevel, clothingCount: number): void {
  const limits = BUSINESS_CONFIG.limits[userLevel];
  
  if (clothingCount > limits.maxClothingItems) {
    const levelNames = { free: 'Free', plus: 'Plus', pro: 'Pro' };
    throw new GenerationLimitExceededError(
      levelNames[userLevel], 
      limits.maxClothingItems, 
      clothingCount
    );
  }
}

export async function POST(request: NextRequest) {
  return ErrorHandler.withErrorHandling(async () => {
    // 检查用户是否登录
    const session = await auth();
    if (!session?.user?.id) {
      throw new UnauthorizedError();
    }

    const userId = parseInt(session.user.id);
    const body = await request.json();
    
    // 验证输入数据
    const validationResult = generateSchema.safeParse(body);
    if (!validationResult.success) {
      throw ErrorFactory.validationError(
        '输入数据无效',
        validationResult.error.issues.map(issue => ({
          code: 'VALIDATION_ERROR',
          message: issue.message,
          field: issue.path.join('.'),
          value: issue.code
        }))
      );
    }
    
    const { userImage, clothingImages, generationType } = validationResult.data;
    
    // 获取用户信息
    const user = await UserDAO.findUserById(userId);
    if (!user) {
      throw ErrorFactory.databaseError('用户不存在', 'findUserById');
    }

    // 检查用户等级权限
    const clothingCount = clothingImages.length;
    const userLevel = user.user_level;
    
    validateUserPermissions(userLevel, clothingCount);

    // 计算积分消耗
    const requiredCredits = calculateRequiredCredits(userLevel, clothingCount);
    const isBatchGeneration = clothingCount > 1 && userLevel === 'pro';
    
    // 检查积分余额
    if (user.credits < requiredCredits) {
      throw new InsufficientCreditsError(requiredCredits, user.credits);
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
      
      // 构建生成请求
      const generationRequest: GenerationRequest = {
        userImage,
        clothingImages,
        generationType
      };
      
      // 调用AI生成服务
      const resultImages = await AIGenerationService.generateWithRetry(generationRequest);
      
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
      await CreditsDAO.updateGenerationStatus(
        generationRecord.id, 
        'failed', 
        error instanceof Error ? error.message : '未知错误'
      );
      
      throw error; // 重新抛出错误，让统一错误处理器处理
    }
    
  }, '生成请求处理').catch(error => {
    // 统一错误响应格式
    if (error instanceof AppError) {
      return NextResponse.json(
        ErrorHandler.formatErrorResponse(error),
        { status: error.statusCode }
      );
    }
    
    // 未知错误
    const internalError = ErrorFactory.internalError('请求处理失败，请稍后重试');
    ErrorHandler.logError(error, '未知错误');
    
    return NextResponse.json(
      ErrorHandler.formatErrorResponse(internalError),
      { status: 500 }
    );
  });
}