'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface UserStats {
  currentCredits: number;
  totalGenerated: number;
  totalCreditsEarned: number;
  totalCreditsSpent: number;
  checkinStreak: number;
  lastCheckin: string | null;
  canCheckinToday: boolean;
}

interface CheckinResult {
  success: boolean;
  message: string;
  creditsAdded?: number;
}

export default function Dashboard() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkinLoading, setCheckinLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (status === 'authenticated') {
      fetchStats();
    }
  }, [status, router]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/user/stats');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('获取用户统计失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckin = async () => {
    setCheckinLoading(true);
    try {
      const response = await fetch('/api/checkin', { method: 'POST' });
      const data: CheckinResult = await response.json();
      
      if (data.success) {
        // 刷新session和统计数据
        await update();
        await fetchStats();
      }
      
      // 显示结果消息 - 这里可以用更好的toast通知
      alert(data.message);
    } catch (error) {
      console.error('签到失败:', error);
      alert('签到失败，请稍后重试');
    } finally {
      setCheckinLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (!session?.user) {
    return null;
  }

  const userLevel = session.user.userLevel || 'free';
  const credits = session.user.credits || 0;

  const getVipBenefits = (level: string) => {
    switch (level) {
      case 'pro':
        return {
          title: 'Pro用户',
          checkinFreq: '每日签到',
          checkinReward: '6积分',
          clothingLimit: '10件服装',
          batchGeneration: '批量生成',
          color: 'text-purple-600',
          bgColor: 'bg-purple-50'
        };
      case 'plus':
        return {
          title: 'Plus用户',
          checkinFreq: '每日签到',
          checkinReward: '6积分',
          clothingLimit: '3件服装',
          batchGeneration: '单次生成',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50'
        };
      case 'free':
      default:
        return {
          title: '免费用户',
          checkinFreq: '每周签到',
          checkinReward: '6积分',
          clothingLimit: '1件服装',
          batchGeneration: '单次生成',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50'
        };
    }
  };

  const vipInfo = getVipBenefits(userLevel);

  return (
    <main className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          欢迎回来，{session.user.email}
        </h1>
        <p className="text-gray-600">
          管理您的账户、积分和AI试穿历史
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* 当前积分 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">当前积分</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{credits}</div>
            <p className="text-xs text-gray-500 mt-1">
              每次生成消耗 2-20 积分
            </p>
          </CardContent>
        </Card>

        {/* VIP等级 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">会员等级</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Badge variant={userLevel === 'pro' ? 'default' : userLevel === 'plus' ? 'info' : 'secondary'}>
                {vipInfo.title}
              </Badge>
              {userLevel === 'free' && (
                <Link href="/upgrade">
                  <Button variant="outline" size="sm">升级</Button>
                </Link>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {vipInfo.checkinFreq} · {vipInfo.clothingLimit}
            </p>
          </CardContent>
        </Card>

        {/* 总生成次数 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">生成次数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalGenerated || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              历史生成总数
            </p>
          </CardContent>
        </Card>

        {/* 签到状态 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">签到状态</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.checkinStreak || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              连续签到天数
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 签到卡片 */}
        <Card>
          <CardHeader>
            <CardTitle>每日签到</CardTitle>
            <CardDescription>
              {vipInfo.checkinFreq}，每次获得 {vipInfo.checkinReward}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats?.canCheckinToday ? (
              <Button 
                onClick={handleCheckin} 
                disabled={checkinLoading}
                className="w-full"
              >
                {checkinLoading ? '签到中...' : `签到获得 ${vipInfo.checkinReward}`}
              </Button>
            ) : (
              <div className="text-center py-4">
                <div className="text-green-600 text-2xl mb-2">✓</div>
                <p className="text-sm text-gray-600">
                  {userLevel === 'free' ? '本周已签到' : '今日已签到'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats?.lastCheckin && `上次签到: ${new Date(stats.lastCheckin).toLocaleString('zh-CN')}`}
                </p>
              </div>
            )}

            {stats?.checkinStreak && stats.checkinStreak > 0 && (
              <div className="text-center">
                <div className="text-sm font-medium text-gray-700 mb-1">
                  连续签到 {stats.checkinStreak} 天
                </div>
                <Progress value={Math.min(stats.checkinStreak * 10, 100)} className="w-full h-2" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* VIP特权卡片 */}
        <Card className={vipInfo.bgColor}>
          <CardHeader>
            <CardTitle className={vipInfo.color}>{vipInfo.title}特权</CardTitle>
            <CardDescription>
              您当前可享受的特权和福利
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex justify-between">
                <span>签到频率:</span>
                <span className="font-medium">{vipInfo.checkinFreq}</span>
              </div>
              <div className="flex justify-between">
                <span>签到奖励:</span>
                <span className="font-medium">{vipInfo.checkinReward}</span>
              </div>
              <div className="flex justify-between">
                <span>服装数量:</span>
                <span className="font-medium">{vipInfo.clothingLimit}</span>
              </div>
              <div className="flex justify-between">
                <span>生成模式:</span>
                <span className="font-medium">{vipInfo.batchGeneration}</span>
              </div>
            </div>

            {userLevel === 'free' && (
              <div className="pt-3 border-t">
                <Link href="/upgrade">
                  <Button variant="outline" className="w-full">
                    升级到Plus
                  </Button>
                </Link>
              </div>
            )}

            {(userLevel === 'free' || userLevel === 'plus') && (
              <div className={userLevel === 'free' ? '' : 'pt-3 border-t'}>
                <Link href="/purchase">
                  <Button className="w-full">
                    充值积分
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 快速操作 */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">快速操作</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/generate">
            <Button variant="outline" className="w-full h-20 flex flex-col">
              <div className="text-2xl mb-1">👗</div>
              <span className="text-sm">AI试穿</span>
            </Button>
          </Link>
          
          <Link href="/purchase">
            <Button variant="outline" className="w-full h-20 flex flex-col">
              <div className="text-2xl mb-1">💎</div>
              <span className="text-sm">充值积分</span>
            </Button>
          </Link>
          
          <Link href="/profile">
            <Button variant="outline" className="w-full h-20 flex flex-col">
              <div className="text-2xl mb-1">📊</div>
              <span className="text-sm">生成历史</span>
            </Button>
          </Link>
          
          {userLevel === 'free' && (
            <Link href="/upgrade">
              <Button variant="outline" className="w-full h-20 flex flex-col">
                <div className="text-2xl mb-1">⭐</div>
                <span className="text-sm">升级Plus</span>
              </Button>
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}