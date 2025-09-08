'use client';

import { Badge } from '@/components/ui/badge';
import { getUserLevelBadgeVariant, getUserLevelDisplayName, getVipInfo } from '@/lib/vip-utils';
import type { UserLevel } from '@/types';

interface VipBadgeProps {
  userLevel: UserLevel;
  showDescription?: boolean;
  className?: string;
}

/**
 * VIP等级徽章组件
 */
export function VipBadge({ userLevel, showDescription = false, className }: VipBadgeProps) {
  const variant = getUserLevelBadgeVariant(userLevel);
  const displayName = getUserLevelDisplayName(userLevel);
  const vipInfo = getVipInfo(userLevel);

  return (
    <div className={className}>
      <Badge variant={variant}>
        {displayName}
      </Badge>
      {showDescription && (
        <span className="ml-2 text-sm text-gray-600">
          {vipInfo.description}
        </span>
      )}
    </div>
  );
}

/**
 * VIP特权卡片组件
 */
interface VipBenefitsCardProps {
  userLevel: UserLevel;
  className?: string;
}

export function VipBenefitsCard({ userLevel, className }: VipBenefitsCardProps) {
  const vipInfo = getVipInfo(userLevel);
  const { limits, benefits } = vipInfo;

  const benefitsList = [
    {
      label: '签到类型',
      value: limits.checkinType === 'daily' ? '每日签到' : '每周签到',
      enabled: true
    },
    {
      label: '服装上传',
      value: `最多${limits.maxClothingItems}件`,
      enabled: true
    },
    {
      label: '批量生成',
      value: limits.canBatchGenerate ? '支持' : '不支持',
      enabled: limits.canBatchGenerate
    },
    {
      label: '微信升级',
      value: benefits.wechatUpgrade ? '支持' : '不支持',
      enabled: benefits.wechatUpgrade
    },
    {
      label: '积分充值',
      value: benefits.creditPackages ? '支持' : '不支持',
      enabled: benefits.creditPackages
    }
  ];

  return (
    <div className={className}>
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">用户特权</h3>
          <VipBadge userLevel={userLevel} />
        </div>
        
        <div className="space-y-2">
          {benefitsList.map((benefit, index) => (
            <div key={index} className="flex justify-between items-center text-sm">
              <span className="text-gray-600">{benefit.label}</span>
              <span className={benefit.enabled ? 'text-green-600' : 'text-gray-400'}>
                {benefit.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}