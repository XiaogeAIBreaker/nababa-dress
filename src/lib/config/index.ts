/**
 * 应用配置管理
 * 统一管理环境变量、AI配置、业务规则等
 */

// 环境变量类型定义
interface EnvironmentConfig {
  NODE_ENV: string;
  TURSO_DATABASE_URL: string;
  TURSO_AUTH_TOKEN: string;
  NEXTAUTH_URL: string;
  NEXTAUTH_SECRET: string;
  APICORE_AI_KEY: string;
  ADMIN_SECRET?: string;
  CRON_SECRET?: string;
}

// AI服务配置
export interface AIConfig {
  apiUrl: string;
  apiKey: string;
  model: string;
  timeout: number;
  maxRetries: number;
  requestOptions: {
    maxTokens: number;
    temperature: number;
  };
}

// 业务规则配置
export interface BusinessConfig {
  credits: {
    checkinAmount: number;
    singleGenerationCost: number;
    batchGenerationCost: number;
  };
  limits: {
    free: {
      maxClothingItems: number;
      checkinType: 'weekly';
    };
    plus: {
      maxClothingItems: number;
      checkinType: 'daily';
    };
    pro: {
      maxClothingItems: number;
      checkinType: 'daily';
    };
  };
}

/**
 * 获取环境变量配置
 */
function getEnvironmentConfig(): EnvironmentConfig {
  const requiredEnvVars = [
    'TURSO_DATABASE_URL',
    'TURSO_AUTH_TOKEN', 
    'NEXTAUTH_SECRET',
    'APICORE_AI_KEY'
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Required environment variable ${envVar} is missing`);
    }
  }

  return {
    NODE_ENV: process.env.NODE_ENV || 'development',
    TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL!,
    TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN!,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET!,
    APICORE_AI_KEY: process.env.APICORE_AI_KEY!,
    ADMIN_SECRET: process.env.ADMIN_SECRET,
    CRON_SECRET: process.env.CRON_SECRET,
  };
}

/**
 * AI服务配置
 */
export const AI_CONFIG: AIConfig = {
  apiUrl: 'https://kg-api.cloud/v1/chat/completions',
  apiKey: getEnvironmentConfig().APICORE_AI_KEY,
  model: 'gemini-2.5-flash-image-preview',
  timeout: 60000, // 60秒
  maxRetries: 2,
  requestOptions: {
    maxTokens: 500,
    temperature: 0.1,
  }
};

/**
 * 业务规则配置
 */
export const BUSINESS_CONFIG: BusinessConfig = {
  credits: {
    checkinAmount: 6,
    singleGenerationCost: 2,
    batchGenerationCost: 20,
  },
  limits: {
    free: {
      maxClothingItems: 1,
      checkinType: 'weekly',
    },
    plus: {
      maxClothingItems: 3,
      checkinType: 'daily',
    },
    pro: {
      maxClothingItems: 10,
      checkinType: 'daily',
    },
  },
};

/**
 * 数据库配置
 */
export const DATABASE_CONFIG = {
  url: getEnvironmentConfig().TURSO_DATABASE_URL,
  authToken: getEnvironmentConfig().TURSO_AUTH_TOKEN,
};

/**
 * 认证配置
 */
export const AUTH_CONFIG = {
  url: getEnvironmentConfig().NEXTAUTH_URL,
  secret: getEnvironmentConfig().NEXTAUTH_SECRET,
};

/**
 * 应用配置常量
 */
export const APP_CONFIG = {
  name: '小猫更衣',
  description: 'AI虚拟试衣平台',
  version: '1.0.0',
  isDevelopment: getEnvironmentConfig().NODE_ENV === 'development',
  isProduction: getEnvironmentConfig().NODE_ENV === 'production',
};

/**
 * 导出环境配置（用于需要完整访问的场景）
 */
export const ENV = getEnvironmentConfig();