import type { 
  UserLevel, 
  VipLimits, 
  VipBenefits, 
  VipInfo, 
  BadgeVariant 
} from '@/types';

/**
 * 获取VIP等级限制
 */
export function getVipLimits(userLevel: UserLevel): VipLimits {
  const limitsMap: Record<UserLevel, VipLimits> = {
    free: {
      maxClothingItems: 1,
      checkinType: 'weekly',
      generationCredits: {
        single: 2,
        batch: 2 // Free用户不能批量生成
      },
      canBatchGenerate: false
    },
    plus: {
      maxClothingItems: 3,
      checkinType: 'daily',
      generationCredits: {
        single: 2,
        batch: 2 // Plus用户虽然可以上传3件，但还是按单次计费
      },
      canBatchGenerate: false
    },
    pro: {
      maxClothingItems: 10,
      checkinType: 'daily',
      generationCredits: {
        single: 2,
        batch: 20
      },
      canBatchGenerate: true
    }
  };

  return limitsMap[userLevel];
}

/**
 * 获取VIP等级权益
 */
export function getVipBenefits(userLevel: UserLevel): VipBenefits {
  const benefitsMap: Record<UserLevel, VipBenefits> = {
    free: {
      dailyCheckin: false,
      weeklyCheckin: true,
      maxClothingItems: 1,
      batchGeneration: false,
      wechatUpgrade: false,
      creditPackages: false
    },
    plus: {
      dailyCheckin: true,
      weeklyCheckin: false,
      maxClothingItems: 3,
      batchGeneration: false,
      wechatUpgrade: true,
      creditPackages: false
    },
    pro: {
      dailyCheckin: true,
      weeklyCheckin: false,
      maxClothingItems: 10,
      batchGeneration: true,
      wechatUpgrade: true,
      creditPackages: true
    }
  };

  return benefitsMap[userLevel];
}

/**
 * 获取VIP等级完整信息
 */
export function getVipInfo(userLevel: UserLevel): VipInfo {
  const infoMap: Record<UserLevel, VipInfo> = {
    free: {
      level: 'free',
      name: 'Free',
      color: 'gray',
      description: '免费用户',
      limits: getVipLimits('free'),
      benefits: getVipBenefits('free')
    },
    plus: {
      level: 'plus',
      name: 'Plus',
      color: 'blue',
      description: '增强用户',
      limits: getVipLimits('plus'),
      benefits: getVipBenefits('plus')
    },
    pro: {
      level: 'pro',
      name: 'Pro',
      color: 'purple',
      description: '专业用户',
      limits: getVipLimits('pro'),
      benefits: getVipBenefits('pro')
    }
  };

  return infoMap[userLevel];
}

/**
 * 获取用户等级对应的Badge变体
 */
export function getUserLevelBadgeVariant(userLevel: UserLevel): BadgeVariant {
  const variantMap: Record<UserLevel, BadgeVariant> = {
    free: 'secondary',
    plus: 'default',
    pro: 'outline'
  };

  return variantMap[userLevel];
}

/**
 * 获取用户等级显示名称
 */
export function getUserLevelDisplayName(userLevel: UserLevel): string {
  const displayNames: Record<UserLevel, string> = {
    free: 'Free',
    plus: 'Plus',
    pro: 'Pro'
  };

  return displayNames[userLevel];
}

/**
 * 检查用户是否可以进行某项操作
 */
export function canUserPerformAction(
  userLevel: UserLevel,
  action: 'batchGenerate' | 'dailyCheckin' | 'purchaseCredits',
  clothingCount?: number
): boolean {
  const limits = getVipLimits(userLevel);
  const benefits = getVipBenefits(userLevel);

  switch (action) {
    case 'batchGenerate':
      if (!limits.canBatchGenerate) return false;
      if (clothingCount && clothingCount > limits.maxClothingItems) return false;
      return true;
    
    case 'dailyCheckin':
      return benefits.dailyCheckin;
    
    case 'purchaseCredits':
      return benefits.creditPackages;
    
    default:
      return false;
  }
}

/**
 * 计算生成所需积分
 */
export function calculateRequiredCredits(
  userLevel: UserLevel,
  clothingCount: number
): number {
  const limits = getVipLimits(userLevel);
  
  // 检查是否可以批量生成
  const canBatch = limits.canBatchGenerate && clothingCount > 1;
  
  return canBatch ? limits.generationCredits.batch : limits.generationCredits.single;
}

/**
 * 检查用户是否为高级用户
 */
export function isPremiumUser(userLevel: UserLevel): boolean {
  return userLevel === 'plus' || userLevel === 'pro';
}

/**
 * 检查用户是否为Pro用户
 */
export function isProUser(userLevel: UserLevel): boolean {
  return userLevel === 'pro';
}

/**
 * 获取下一级VIP等级
 */
export function getNextVipLevel(userLevel: UserLevel): UserLevel | null {
  const hierarchy: UserLevel[] = ['free', 'plus', 'pro'];
  const currentIndex = hierarchy.indexOf(userLevel);
  
  if (currentIndex === -1 || currentIndex === hierarchy.length - 1) {
    return null;
  }
  
  return hierarchy[currentIndex + 1];
}

/**
 * 获取VIP升级路径信息
 */
export function getVipUpgradePath(currentLevel: UserLevel): {
  nextLevel: UserLevel | null;
  upgradeMethod: 'wechat' | 'purchase' | null;
  description: string;
} {
  switch (currentLevel) {
    case 'free':
      return {
        nextLevel: 'plus',
        upgradeMethod: 'wechat',
        description: '通过微信升级到Plus用户'
      };
    case 'plus':
      return {
        nextLevel: 'pro',
        upgradeMethod: 'purchase',
        description: '通过购买积分包升级到Pro用户'
      };
    case 'pro':
      return {
        nextLevel: null,
        upgradeMethod: null,
        description: '您已是最高等级用户'
      };
    default:
      return {
        nextLevel: null,
        upgradeMethod: null,
        description: ''
      };
  }
}

/**
 * 格式化积分显示
 */
export function formatCredits(credits: number): string {
  if (credits >= 1000) {
    return `${(credits / 1000).toFixed(1)}k`;
  }
  return credits.toString();
}

/**
 * 获取VIP等级的CSS类名
 */
export function getVipLevelClassName(userLevel: UserLevel): string {
  const classMap: Record<UserLevel, string> = {
    free: 'text-gray-600 bg-gray-100',
    plus: 'text-blue-600 bg-blue-100',
    pro: 'text-purple-600 bg-purple-100'
  };

  return classMap[userLevel];
}

/**
 * 获取签到类型的描述文本
 */
export function getCheckinTypeDescription(userLevel: UserLevel): string {
  const limits = getVipLimits(userLevel);
  return limits.checkinType === 'daily' ? '每日签到' : '每周签到';
}