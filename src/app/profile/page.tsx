'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface HistoryItem {
  id: number;
  type: 'checkin' | 'purchase' | 'generation';
  amount?: number;
  description: string;
  created_at: string;
  status?: string;
}

interface UserStats {
  // 生成统计
  total_generations: number;
  successful_generations: number;
  failed_generations: number;
  total_credits_used: number;
  
  // 签到统计
  total_checkins: number;
  total_checkin_credits: number;
  
  // 充值统计
  total_purchases: number;
  total_purchased_credits: number;
}

export default function Profile() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'checkin' | 'purchase' | 'generation'>('overview');
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (status === 'authenticated') {
      fetchUserStats();
      fetchHistory('checkin');
    }
  }, [status, router]);

  const fetchUserStats = async () => {
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

  const fetchHistory = async (type: 'checkin' | 'purchase' | 'generation') => {
    try {
      const response = await fetch(`/api/user/history?type=${type}&limit=20`);
      const data = await response.json();
      
      if (data.success) {
        setHistoryData(data.data || []);
      }
    } catch (error) {
      console.error('获取历史数据失败:', error);
      setHistoryData([]);
    }
  };

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (tab !== 'overview') {
      fetchHistory(tab);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">已完成</Badge>;
      case 'pending':
        return <Badge variant="warning">处理中</Badge>;
      case 'failed':
        return <Badge variant="destructive">失败</Badge>;
      case 'success':
        return <Badge variant="success">成功</Badge>;
      default:
        return null;
    }
  };

  const getVipInfo = (userLevel?: string) => {
    switch (userLevel) {
      case 'pro':
        return { title: 'Pro用户', color: 'text-purple-600', bgColor: 'bg-purple-50' };
      case 'plus':
        return { title: 'Plus用户', color: 'text-blue-600', bgColor: 'bg-blue-50' };
      case 'free':
      default:
        return { title: '免费用户', color: 'text-gray-600', bgColor: 'bg-gray-50' };
    }
  };

  if (status === 'loading' || loading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 h-64 bg-gray-200 rounded"></div>
            <div className="lg:col-span-2 h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </main>
    );
  }

  if (!session?.user) {
    return null;
  }

  const vipInfo = getVipInfo(session.user.userLevel);

  return (
    <main className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          个人中心
        </h1>
        <p className="text-gray-600">
          管理您的账户信息和使用历史
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* 左侧用户信息 */}
        <div className="lg:col-span-1 space-y-6">
          {/* 用户卡片 */}
          <Card className={vipInfo.bgColor}>
            <CardHeader>
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-300 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl">
                  👤
                </div>
                <CardTitle className="text-lg">{session.user.email}</CardTitle>
                <CardDescription>
                  <Badge variant={session.user.userLevel === 'pro' ? 'default' : session.user.userLevel === 'plus' ? 'info' : 'secondary'}>
                    {vipInfo.title}
                  </Badge>
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="text-center space-y-3">
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex justify-between">
                  <span>当前积分:</span>
                  <span className="font-semibold text-green-600">{session.user.credits}</span>
                </div>
                <div className="flex justify-between">
                  <span>总生成数:</span>
                  <span className="font-semibold">{stats?.total_generations || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>成功生成:</span>
                  <span className="font-semibold">{stats?.successful_generations || 0}</span>
                </div>
                {session.user.wechatUpgraded && (
                  <div className="flex justify-between">
                    <span>微信验证:</span>
                    <Badge variant="success" className="h-5">✓</Badge>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t space-y-2">
                {session.user.userLevel === 'free' && (
                  <>
                    <Link href="/upgrade">
                      <Button variant="outline" size="sm" className="w-full">
                        升级Plus
                      </Button>
                    </Link>
                    <Link href="/purchase">
                      <Button size="sm" className="w-full">
                        充值积分
                      </Button>
                    </Link>
                  </>
                )}
                
                {session.user.userLevel === 'plus' && (
                  <Link href="/purchase">
                    <Button size="sm" className="w-full">
                      充值升级Pro
                    </Button>
                  </Link>
                )}
                
                {session.user.userLevel === 'pro' && (
                  <Link href="/purchase">
                    <Button variant="outline" size="sm" className="w-full">
                      充值积分
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 快速统计 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">使用统计</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span>累计获得积分:</span>
                <span className="font-semibold text-green-600">{(stats?.total_checkin_credits || 0) + (stats?.total_purchased_credits || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>累计消耗积分:</span>
                <span className="font-semibold text-red-600">{stats?.total_credits_used || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>积分余额:</span>
                <span className="font-semibold">{session.user.credits || 0}</span>
              </div>
              <div className="pt-2 border-t text-xs text-gray-500">
                签到次数: {stats?.total_checkins || 0} · 充值次数: {stats?.total_purchases || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧内容区域 */}
        <div className="lg:col-span-3">
          {/* 标签导航 */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'overview', label: '概览', icon: '📊' },
                  { key: 'checkin', label: '签到历史', icon: '✅' },
                  { key: 'purchase', label: '充值记录', icon: '💳' },
                  { key: 'generation', label: '生成历史', icon: '🎨' },
                ].map((tab) => (
                  <Button
                    key={tab.key}
                    variant={activeTab === tab.key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleTabChange(tab.key as typeof activeTab)}
                  >
                    <span className="mr-1">{tab.icon}</span>
                    {tab.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 内容区域 */}
          <Card>
            <CardHeader>
              <CardTitle>
                {activeTab === 'overview' && '账户概览'}
                {activeTab === 'checkin' && '签到历史'}
                {activeTab === 'purchase' && '充值记录'}
                {activeTab === 'generation' && '生成历史'}
              </CardTitle>
              <CardDescription>
                {activeTab === 'overview' && '您的账户使用情况总览'}
                {activeTab === 'checkin' && '最近的签到记录'}
                {activeTab === 'purchase' && '积分充值和消费记录'}
                {activeTab === 'generation' && 'AI试穿生成历史'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* 概览页面 */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* 账户信息 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="font-medium text-green-800 mb-2">积分状况</h3>
                      <div className="text-2xl font-bold text-green-600 mb-1">
                        {session.user.credits || 0}
                      </div>
                      <p className="text-sm text-green-600">
                        可生成约 {Math.floor((session.user.credits || 0) / 2)} 次
                      </p>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-medium text-blue-800 mb-2">使用情况</h3>
                      <div className="text-2xl font-bold text-blue-600 mb-1">
                        {stats?.total_generations || 0}
                      </div>
                      <p className="text-sm text-blue-600">
                        历史生成总数 (成功 {stats?.successful_generations || 0} 次)
                      </p>
                    </div>
                  </div>

                  {/* VIP特权说明 */}
                  <div className={`p-4 rounded-lg ${vipInfo.bgColor}`}>
                    <h3 className={`font-medium mb-3 ${vipInfo.color}`}>
                      {vipInfo.title}特权
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium mb-2">当前特权:</p>
                        <ul className="space-y-1 text-gray-600">
                          <li>• 签到频率: {session.user.userLevel === 'free' ? '每周' : '每日'}</li>
                          <li>• 服装数量: {session.user.userLevel === 'pro' ? '10件' : session.user.userLevel === 'plus' ? '3件' : '1件'}</li>
                          <li>• 生成模式: {session.user.userLevel === 'pro' ? '批量生成' : '单次生成'}</li>
                          <li>• 客服支持: {session.user.userLevel === 'pro' ? '专属' : session.user.userLevel === 'plus' ? '优先' : '基础'}</li>
                        </ul>
                      </div>
                      
                      <div>
                        <p className="font-medium mb-2">升级建议:</p>
                        {session.user.userLevel === 'free' && (
                          <div className="space-y-2">
                            <p className="text-sm text-gray-600">升级Plus享受每日签到</p>
                            <Link href="/upgrade">
                              <Button size="sm" variant="outline">免费升级Plus</Button>
                            </Link>
                          </div>
                        )}
                        {session.user.userLevel !== 'pro' && (
                          <div className="space-y-2">
                            <p className="text-sm text-gray-600">充值积分自动升级Pro</p>
                            <Link href="/purchase">
                              <Button size="sm">充值升级Pro</Button>
                            </Link>
                          </div>
                        )}
                        {session.user.userLevel === 'pro' && (
                          <p className="text-sm text-green-600">您已享受最高等级特权！</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 快速操作 */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link href="/dashboard">
                      <Button variant="outline" className="w-full h-16 flex flex-col">
                        <span className="text-xl mb-1">🏠</span>
                        <span className="text-sm">控制台</span>
                      </Button>
                    </Link>
                    
                    <Link href="/generate">
                      <Button variant="outline" className="w-full h-16 flex flex-col">
                        <span className="text-xl mb-1">🎨</span>
                        <span className="text-sm">AI试穿</span>
                      </Button>
                    </Link>
                    
                    <Link href="/purchase">
                      <Button variant="outline" className="w-full h-16 flex flex-col">
                        <span className="text-xl mb-1">💎</span>
                        <span className="text-sm">充值积分</span>
                      </Button>
                    </Link>
                    
                    {session.user.userLevel === 'free' && (
                      <Link href="/upgrade">
                        <Button variant="outline" className="w-full h-16 flex flex-col">
                          <span className="text-xl mb-1">⭐</span>
                          <span className="text-sm">升级</span>
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {/* 历史记录页面 */}
              {activeTab !== 'overview' && (
                <div className="space-y-4">
                  {historyData.length > 0 ? (
                    historyData.map((item) => (
                      <div key={item.id} className="border-b pb-4 last:border-b-0">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium">{item.description}</div>
                            <div className="text-sm text-gray-500">
                              {formatDate(item.created_at)}
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            {item.amount && (
                              <span className={`font-semibold ${
                                item.type === 'checkin' || item.type === 'purchase' 
                                  ? 'text-green-600' 
                                  : 'text-red-600'
                              }`}>
                                {item.type === 'generation' ? '-' : '+'}
                                {item.amount} 积分
                              </span>
                            )}
                            {getStatusBadge(item.status)}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-4">📋</div>
                      <p>暂无记录</p>
                      <p className="text-sm mt-2">
                        {activeTab === 'checkin' && '还没有签到记录，去控制台签到吧'}
                        {activeTab === 'purchase' && '还没有充值记录，去充值积分吧'}
                        {activeTab === 'generation' && '还没有生成记录，去尝试AI试穿吧'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}