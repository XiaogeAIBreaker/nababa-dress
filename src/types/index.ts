// 用户相关类型
export interface User {
  id: number;
  email: string;
  password_hash: string;
  user_level: UserLevel;
  credits: number;
  wechat_upgraded: boolean;
  created_at: Date;
  updated_at: Date;
}

export type UserLevel = 'free' | 'plus' | 'pro';

export interface CreateUserInput {
  email: string;
  password: string;
}

export interface UpdateUserInput {
  user_level?: UserLevel;
  credits?: number;
  wechat_upgraded?: boolean;
}

// VIP系统相关类型
export interface VipLimits {
  maxClothingItems: number;
  checkinType: 'daily' | 'weekly';
  generationCredits: {
    single: number;
    batch: number;
  };
  canBatchGenerate: boolean;
}

export interface VipBenefits {
  dailyCheckin: boolean;
  weeklyCheckin: boolean;
  maxClothingItems: number;
  batchGeneration: boolean;
  wechatUpgrade: boolean;
  creditPackages: boolean;
}

export interface VipInfo {
  level: UserLevel;
  name: string;
  color: 'gray' | 'blue' | 'purple';
  description: string;
  limits: VipLimits;
  benefits: VipBenefits;
}

// 签到相关类型
export interface UserCheckin {
  id: number;
  user_id: number;
  checkin_type: 'daily' | 'weekly';
  checkin_period: string;
  credits_awarded: number;
  created_at: Date;
}

export interface CheckinStatus {
  canCheckin: boolean;
  nextCheckinTime?: Date;
  checkinType: string;
}

export interface CheckinResult {
  success: boolean;
  message: string;
  creditsAwarded?: number;
  checkinType?: string;
}

// 积分包相关类型
export interface CreditPackage {
  name: string;
  price: number;
  baseCredits: number;
  bonusCredits: number;
  totalCredits: number;
  description: string;
}

export interface CreditPurchase {
  id: number;
  user_id: number;
  package_name: string;
  package_price: number;
  base_credits: number;
  bonus_credits: number;
  total_credits: number;
  payment_method: string;
  transaction_status: string;
  admin_note?: string;
  created_at: Date;
}

export interface PurchaseResult {
  success: boolean;
  message: string;
  creditsAdded?: number;
  newUserLevel?: string;
}

// 生成历史相关类型
export interface GenerationHistory {
  id: number;
  user_id: number;
  credits_used: number;
  clothing_count: number;
  generation_type: 'single' | 'batch';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  processing_time?: number;
  created_at: Date;
  completed_at?: Date;
}

export interface GenerationRequest {
  userImage: string;
  clothingImages: string[];
  generationType?: 'single' | 'batch';
}

export interface GenerationResult {
  success: boolean;
  message: string;
  data?: {
    images: string[];
    creditsUsed: number;
    generationType: 'single' | 'batch';
    generatedCount: number;
  };
  error?: string;
  requiredCredits?: number;
  currentCredits?: number;
}

// 用户统计相关类型
export interface UserStats {
  total_generations: number;
  successful_generations: number;
  failed_generations: number;
  total_credits_used: number;
  current_credits: number;
}

export interface UserCreditStats extends UserStats {
  total_checkins: number;
  total_checkin_credits: number;
  total_purchases: number;
  total_purchased_credits: number;
}

// API 响应通用类型
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: Array<{
    code: string;
    message: string;
    path?: string[];
  }>;
}

// Session 扩展类型 (与NextAuth兼容)
export interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  userLevel?: UserLevel;
  credits?: number;
  wechatUpgraded?: boolean;
  isPremiumUser?: boolean;
  isProUser?: boolean;
}

// UI相关类型
export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface FormErrors {
  [key: string]: string | undefined;
}

// 文件上传相关类型
export interface ImageFile {
  file: File;
  preview: string;
  base64?: string;
}

// Badge variants (shadcn/ui兼容)
export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

// 历史记录查询参数
export interface HistoryQueryParams {
  type: 'checkin' | 'purchase' | 'generation';
  limit?: number;
  offset?: number;
}