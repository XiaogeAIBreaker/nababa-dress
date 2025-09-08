'use client';

import { Coins, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCredits } from '@/lib/vip-utils';
import { Card } from '@/components/ui/card';

interface CreditsDisplayProps {
  credits: number;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * 积分显示组件
 */
export function CreditsDisplay({ 
  credits, 
  className, 
  showIcon = true, 
  size = 'md' 
}: CreditsDisplayProps) {
  const sizeStyles = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg font-semibold'
  };

  const iconSize = {
    sm: 16,
    md: 20,
    lg: 24
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {showIcon && (
        <Coins 
          className="text-yellow-500" 
          size={iconSize[size]}
        />
      )}
      <span className={`font-mono ${sizeStyles[size]}`}>
        {formatCredits(credits)}
      </span>
    </div>
  );
}

/**
 * 积分变化显示组件
 */
interface CreditsChangeProps {
  change: number;
  className?: string;
}

export function CreditsChange({ change, className }: CreditsChangeProps) {
  if (change === 0) return null;

  const isPositive = change > 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;
  const colorClass = isPositive ? 'text-green-600' : 'text-red-600';

  return (
    <div className={`flex items-center space-x-1 ${colorClass} ${className}`}>
      <Icon size={16} />
      <span className="text-sm font-mono">
        {isPositive ? '+' : ''}{change}
      </span>
    </div>
  );
}

/**
 * 积分统计卡片组件
 */
interface CreditsStatsCardProps {
  currentCredits: number;
  totalEarned?: number;
  totalSpent?: number;
  className?: string;
}

export function CreditsStatsCard({ 
  currentCredits, 
  totalEarned = 0, 
  totalSpent = 0, 
  className 
}: CreditsStatsCardProps) {
  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">积分余额</h3>
          <CreditsDisplay credits={currentCredits} size="lg" />
        </div>
        
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatCredits(totalEarned)}
            </div>
            <div className="text-sm text-gray-500">累计获得</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {formatCredits(totalSpent)}
            </div>
            <div className="text-sm text-gray-500">累计消费</div>
          </div>
        </div>
      </div>
    </Card>
  );
}

/**
 * 积分余额警告组件
 */
interface CreditsWarningProps {
  credits: number;
  requiredCredits: number;
  className?: string;
}

export function CreditsWarning({ credits, requiredCredits, className }: CreditsWarningProps) {
  if (credits >= requiredCredits) return null;

  const shortage = requiredCredits - credits;

  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-3 ${className}`}>
      <div className="flex items-center space-x-2">
        <span className="text-yellow-600">⚠️</span>
        <div className="text-sm">
          <p className="text-yellow-800 font-medium">积分不足</p>
          <p className="text-yellow-700">
            当前积分: <CreditsDisplay credits={credits} showIcon={false} size="sm" className="inline" />
            ，还需: <CreditsDisplay credits={shortage} showIcon={false} size="sm" className="inline text-red-600" />
          </p>
        </div>
      </div>
    </div>
  );
}