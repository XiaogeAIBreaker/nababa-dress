/**
 * 统一错误处理体系
 * 定义业务异常类型和错误处理工具
 */

/**
 * 错误类型枚举
 */
export enum ErrorType {
  // 认证相关错误
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  
  // 业务逻辑错误
  INSUFFICIENT_CREDITS = 'INSUFFICIENT_CREDITS',
  INVALID_USER_LEVEL = 'INVALID_USER_LEVEL',
  GENERATION_LIMIT_EXCEEDED = 'GENERATION_LIMIT_EXCEEDED',
  
  // 外部服务错误
  AI_API_ERROR = 'AI_API_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  
  // 输入验证错误
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_IMAGE_FORMAT = 'INVALID_IMAGE_FORMAT',
  
  // 系统错误
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE'
}

/**
 * 错误详情接口
 */
export interface ErrorDetails {
  code: string;
  message: string;
  field?: string;
  value?: any;
}

/**
 * 基础应用错误类
 */
export abstract class AppError extends Error {
  abstract readonly type: ErrorType;
  abstract readonly statusCode: number;
  abstract readonly isOperational: boolean;
  
  public readonly details?: ErrorDetails[];
  public readonly timestamp: Date;

  constructor(
    message: string,
    details?: ErrorDetails[]
  ) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
    this.timestamp = new Date();
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 认证错误
 */
export class UnauthorizedError extends AppError {
  readonly type = ErrorType.UNAUTHORIZED;
  readonly statusCode = 401;
  readonly isOperational = true;

  constructor(message = '请先登录') {
    super(message);
  }
}

/**
 * 权限错误
 */
export class ForbiddenError extends AppError {
  readonly type = ErrorType.FORBIDDEN;
  readonly statusCode = 403;
  readonly isOperational = true;

  constructor(message = '权限不足') {
    super(message);
  }
}

/**
 * 积分不足错误
 */
export class InsufficientCreditsError extends AppError {
  readonly type = ErrorType.INSUFFICIENT_CREDITS;
  readonly statusCode = 402;
  readonly isOperational = true;

  constructor(
    requiredCredits: number, 
    currentCredits: number
  ) {
    super(`积分不足，需要${requiredCredits}积分，当前余额${currentCredits}积分`);
    this.details = [
      {
        code: 'INSUFFICIENT_CREDITS',
        message: this.message,
        field: 'credits',
        value: { required: requiredCredits, current: currentCredits }
      }
    ];
  }
}

/**
 * 生成限制超出错误
 */
export class GenerationLimitExceededError extends AppError {
  readonly type = ErrorType.GENERATION_LIMIT_EXCEEDED;
  readonly statusCode = 403;
  readonly isOperational = true;

  constructor(userLevel: string, limit: number, attempted: number) {
    super(`${userLevel}用户最多上传${limit}件服装图片，实际上传${attempted}件`);
    this.details = [
      {
        code: 'GENERATION_LIMIT_EXCEEDED',
        message: this.message,
        field: 'clothingCount',
        value: { userLevel, limit, attempted }
      }
    ];
  }
}

/**
 * AI API错误
 */
export class AIAPIError extends AppError {
  readonly type = ErrorType.AI_API_ERROR;
  readonly statusCode = 503;
  readonly isOperational = true;

  constructor(message: string, apiResponse?: any) {
    super(`AI服务错误: ${message}`);
    this.details = apiResponse ? [
      {
        code: 'AI_API_ERROR',
        message: this.message,
        value: apiResponse
      }
    ] : undefined;
  }
}

/**
 * 数据库错误
 */
export class DatabaseError extends AppError {
  readonly type = ErrorType.DATABASE_ERROR;
  readonly statusCode = 503;
  readonly isOperational = true;

  constructor(message: string, operation?: string) {
    super(`数据库操作失败: ${message}`);
    this.details = operation ? [
      {
        code: 'DATABASE_ERROR',
        message: this.message,
        field: 'operation',
        value: operation
      }
    ] : undefined;
  }
}

/**
 * 输入验证错误
 */
export class ValidationError extends AppError {
  readonly type = ErrorType.VALIDATION_ERROR;
  readonly statusCode = 400;
  readonly isOperational = true;

  constructor(message: string, validationDetails?: ErrorDetails[]) {
    super(message);
    this.details = validationDetails;
  }
}

/**
 * 内部服务器错误
 */
export class InternalServerError extends AppError {
  readonly type = ErrorType.INTERNAL_SERVER_ERROR;
  readonly statusCode = 500;
  readonly isOperational = false;

  constructor(message = '内部服务器错误') {
    super(message);
  }
}

/**
 * 错误处理工具类
 */
export class ErrorHandler {
  
  /**
   * 格式化错误响应
   */
  static formatErrorResponse(error: AppError) {
    return {
      success: false,
      message: error.message,
      error: error.type,
      details: error.details,
      timestamp: error.timestamp.toISOString()
    };
  }

  /**
   * 判断是否为可操作错误
   */
  static isOperationalError(error: Error): boolean {
    if (error instanceof AppError) {
      return error.isOperational;
    }
    return false;
  }

  /**
   * 记录错误日志
   */
  static logError(error: Error, context?: string) {
    const logData = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    };

    if (error instanceof AppError) {
      logData.context = `${context || ''} [${error.type}]`;
      console.error('业务错误:', logData);
    } else {
      console.error('系统错误:', logData);
    }
  }

  /**
   * 包装异步函数，统一错误处理
   */
  static async withErrorHandling<T>(
    fn: () => Promise<T>,
    context?: string
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      this.logError(error as Error, context);
      throw error;
    }
  }
}

/**
 * 错误工厂类 - 快速创建常见错误
 */
export class ErrorFactory {
  
  static unauthorized(message?: string) {
    return new UnauthorizedError(message);
  }

  static forbidden(message?: string) {
    return new ForbiddenError(message);
  }

  static insufficientCredits(required: number, current: number) {
    return new InsufficientCreditsError(required, current);
  }

  static generationLimitExceeded(userLevel: string, limit: number, attempted: number) {
    return new GenerationLimitExceededError(userLevel, limit, attempted);
  }

  static aiApiError(message: string, response?: any) {
    return new AIAPIError(message, response);
  }

  static databaseError(message: string, operation?: string) {
    return new DatabaseError(message, operation);
  }

  static validationError(message: string, details?: ErrorDetails[]) {
    return new ValidationError(message, details);
  }

  static internalError(message?: string) {
    return new InternalServerError(message);
  }
}