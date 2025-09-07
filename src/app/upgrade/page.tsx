'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Upgrade() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    // 如果用户已经是Pro或Plus，重定向到仪表板
    if (session?.user?.userLevel && session.user.userLevel !== 'free') {
      router.push('/dashboard');
      return;
    }
  }, [status, session, router]);

  const handleWeChatUpgrade = async () => {
    setLoading(true);
    
    // 这里模拟微信升级流程
    // 实际实现中，您需要集成真实的微信验证或支付流程
    try {
      // 暂时显示提示信息，等待后续集成微信API
      alert('微信升级功能开发中...\n\n当前版本采用离线升级方式：\n1. 添加客服微信：xiaomaogengyi\n2. 发送升级申请\n3. 客服审核后手动升级\n\n如需立即升级，请选择积分充值方式自动升级为Pro用户。');
    } catch (error) {
      console.error('微信升级失败:', error);
      alert('升级失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </main>
    );
  }

  if (!session?.user || session.user.userLevel !== 'free') {
    return null;
  }

  return (
    <main className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          升级会员
        </h1>
        <p className="text-gray-600">
          解锁更多特权，享受更好的AI试穿体验
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* 当前状态 */}
        <Card className="mb-8 bg-gray-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Badge variant="secondary">Free</Badge>
              <span>当前：免费用户</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex justify-between">
                <span>签到频率:</span>
                <span>每周一次</span>
              </div>
              <div className="flex justify-between">
                <span>服装数量:</span>
                <span>1件</span>
              </div>
              <div className="flex justify-between">
                <span>生成模式:</span>
                <span>单次生成</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 升级选项 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Plus升级 */}
          <Card className="border-2 border-blue-500 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge variant="info" className="px-3 py-1">
                🎉 社交升级
              </Badge>
            </div>
            
            <CardHeader className="text-center pt-8">
              <CardTitle className="text-2xl text-blue-600">Plus 用户</CardTitle>
              <CardDescription>
                通过微信验证免费升级
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* 特权对比 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm">签到频率</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400 line-through">每周</span>
                    <span className="text-green-600 font-medium">每日</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm">服装数量</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400 line-through">1件</span>
                    <span className="text-green-600 font-medium">3件</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm">微信标识</span>
                  <span className="text-green-600 font-medium">✓ 已验证</span>
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm">优先支持</span>
                  <span className="text-green-600 font-medium">✓ 支持</span>
                </div>
              </div>

              {/* 升级按钮 */}
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-2">
                  ¥0
                </div>
                <p className="text-xs text-gray-500 mb-4">
                  通过微信验证免费升级
                </p>
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={handleWeChatUpgrade}
                  disabled={loading}
                >
                  {loading ? '升级中...' : '微信验证升级'}
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  需要添加客服微信完成验证
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Pro升级 */}
          <Card className="border-2 border-purple-500 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge variant="default" className="px-3 py-1">
                ⭐ 最超值
              </Badge>
            </div>
            
            <CardHeader className="text-center pt-8">
              <CardTitle className="text-2xl text-purple-600">Pro 用户</CardTitle>
              <CardDescription>
                充值任意积分包自动升级
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* 特权对比 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm">所有Plus特权</span>
                  <span className="text-green-600 font-medium">✓ 包含</span>
                </div>
                
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm">服装数量</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400 line-through">3件</span>
                    <span className="text-green-600 font-medium">10件</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm">生成模式</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400 line-through">单次</span>
                    <span className="text-green-600 font-medium">批量</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm">专属客服</span>
                  <span className="text-green-600 font-medium">✓ 支持</span>
                </div>
              </div>

              {/* 升级按钮 */}
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-2">
                  ¥6起
                </div>
                <p className="text-xs text-gray-500 mb-4">
                  充值任意积分包自动升级
                </p>
                <Link href="/purchase">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700">
                    选择积分包
                  </Button>
                </Link>
                <p className="text-xs text-gray-500 mt-2">
                  立即获得积分 + Pro特权
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 特权详细对比 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>特权详细对比</CardTitle>
            <CardDescription>
              了解不同等级的具体差异
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">功能</th>
                    <th className="text-center py-3 px-2">
                      <Badge variant="secondary">Free</Badge>
                    </th>
                    <th className="text-center py-3 px-2">
                      <Badge variant="info">Plus</Badge>
                    </th>
                    <th className="text-center py-3 px-2">
                      <Badge variant="default">Pro</Badge>
                    </th>
                  </tr>
                </thead>
                <tbody className="space-y-2">
                  <tr className="border-b">
                    <td className="py-3 px-2 font-medium">签到频率</td>
                    <td className="text-center py-3 px-2">每周</td>
                    <td className="text-center py-3 px-2 text-blue-600">每日</td>
                    <td className="text-center py-3 px-2 text-purple-600">每日</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-2 font-medium">签到奖励</td>
                    <td className="text-center py-3 px-2">6积分</td>
                    <td className="text-center py-3 px-2 text-blue-600">6积分</td>
                    <td className="text-center py-3 px-2 text-purple-600">6积分</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-2 font-medium">服装数量</td>
                    <td className="text-center py-3 px-2">1件</td>
                    <td className="text-center py-3 px-2 text-blue-600">3件</td>
                    <td className="text-center py-3 px-2 text-purple-600">10件</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-2 font-medium">生成模式</td>
                    <td className="text-center py-3 px-2">单次</td>
                    <td className="text-center py-3 px-2 text-blue-600">单次</td>
                    <td className="text-center py-3 px-2 text-purple-600">批量</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-2 font-medium">积分消耗</td>
                    <td className="text-center py-3 px-2">2/次</td>
                    <td className="text-center py-3 px-2 text-blue-600">2/次</td>
                    <td className="text-center py-3 px-2 text-purple-600">2单次/20批量</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-2 font-medium">微信标识</td>
                    <td className="text-center py-3 px-2">-</td>
                    <td className="text-center py-3 px-2 text-blue-600">✓</td>
                    <td className="text-center py-3 px-2 text-purple-600">✓</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-2 font-medium">客服支持</td>
                    <td className="text-center py-3 px-2">基础</td>
                    <td className="text-center py-3 px-2 text-blue-600">优先</td>
                    <td className="text-center py-3 px-2 text-purple-600">专属</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card className="bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800">常见问题</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-yellow-700">
            <div>
              <p className="font-medium mb-1">Q: Plus用户微信升级如何操作？</p>
              <p>A: 添加客服微信(xiaomaogengyi)，发送升级申请，客服审核后手动升级账户。</p>
            </div>
            <div>
              <p className="font-medium mb-1">Q: Pro用户的批量生成是什么？</p>
              <p>A: 可以一次上传多件服装（最多10件），一键生成多套试穿效果，大幅提升效率。</p>
            </div>
            <div>
              <p className="font-medium mb-1">Q: 升级后原有积分会保留吗？</p>
              <p>A: 是的，升级不会影响现有积分，所有积分永久有效。</p>
            </div>
            <div>
              <p className="font-medium mb-1">Q: 可以从Plus直接升级到Pro吗？</p>
              <p>A: 可以，充值任意积分包即可从Plus自动升级到Pro。</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}