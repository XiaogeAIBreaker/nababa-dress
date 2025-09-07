'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CreditPackage {
  name: string;
  price: number;
  baseCredits: number;
  bonusCredits: number;
  totalCredits: number;
  description: string;
}

interface PurchaseHistory {
  id: number;
  package_name: string;
  credits_added: number;
  amount_paid: number;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  admin_note?: string;
}

export default function Purchase() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [showPaymentInfo, setShowPaymentInfo] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (status === 'authenticated') {
      fetchPackages();
      fetchPurchaseHistory();
    }
  }, [status, router]);

  const fetchPackages = async () => {
    try {
      const response = await fetch('/api/purchase');
      const data = await response.json();
      
      if (data.success) {
        setPackages(data.data);
      }
    } catch (error) {
      console.error('获取积分包失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchaseHistory = async () => {
    try {
      const response = await fetch('/api/user/history?type=purchase&limit=10');
      const data = await response.json();
      
      if (data.success) {
        setPurchaseHistory(data.data || []);
      }
    } catch (error) {
      console.error('获取购买历史失败:', error);
    }
  };

  const handlePackageSelect = (pkg: CreditPackage) => {
    setSelectedPackage(pkg);
    setShowPaymentInfo(true);
  };

  const handlePurchaseSubmit = async () => {
    if (!selectedPackage) return;

    try {
      const response = await fetch('/api/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageName: selectedPackage.name,
          adminNote: '前端购买请求 - 待管理员处理'
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`购买请求已提交！\n包名: ${selectedPackage.name}\n积分: ${data.data.creditsAdded}\n状态: 待处理\n\n请联系管理员完成支付确认。`);
        setShowPaymentInfo(false);
        setSelectedPackage(null);
        fetchPurchaseHistory();
      } else {
        alert('提交失败: ' + data.message);
      }
    } catch (error) {
      console.error('提交购买请求失败:', error);
      alert('提交失败，请稍后重试');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">已完成</Badge>;
      case 'pending':
        return <Badge variant="warning">处理中</Badge>;
      case 'failed':
        return <Badge variant="destructive">失败</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPackagePopularity = (price: number) => {
    if (price === 30) return '🔥 热门选择';
    if (price === 98) return '⭐ 最超值';
    if (price === 6) return '💎 新手首选';
    return null;
  };

  if (status === 'loading' || loading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <main className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          积分充值
        </h1>
        <p className="text-gray-600 mb-4">
          选择积分包，享受AI虚拟试穿服务
        </p>
        <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
          <span>当前积分: <span className="font-semibold text-green-600">{session.user.credits}</span></span>
          <span>·</span>
          <span>会员等级: <Badge variant={session.user.userLevel === 'pro' ? 'default' : session.user.userLevel === 'plus' ? 'info' : 'secondary'}>
            {session.user.userLevel === 'pro' ? 'Pro' : session.user.userLevel === 'plus' ? 'Plus' : 'Free'}
          </Badge></span>
        </div>
      </div>

      {!showPaymentInfo ? (
        <>
          {/* 积分包选择 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
            {packages.map((pkg, index) => {
              const popularity = getPackagePopularity(pkg.price);
              const discount = pkg.bonusCredits > 0 ? Math.round((pkg.bonusCredits / pkg.baseCredits) * 100) : 0;
              
              return (
                <Card 
                  key={index} 
                  className={`relative cursor-pointer transition-all hover:shadow-lg ${
                    pkg.price === 98 ? 'border-2 border-blue-500' : 'hover:border-gray-300'
                  }`}
                  onClick={() => handlePackageSelect(pkg)}
                >
                  {popularity && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge variant="default" className="text-xs px-2 py-1">
                        {popularity}
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-lg">{pkg.name}</CardTitle>
                    <CardDescription>{pkg.description}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="text-center space-y-4">
                    <div className="text-3xl font-bold text-green-600">
                      ¥{pkg.price}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>基础积分:</span>
                        <span>{pkg.baseCredits}</span>
                      </div>
                      {pkg.bonusCredits > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>赠送积分:</span>
                          <span>+{pkg.bonusCredits}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold border-t pt-2">
                        <span>总积分:</span>
                        <span className="text-green-600">{pkg.totalCredits}</span>
                      </div>
                    </div>

                    {discount > 0 && (
                      <Badge variant="success" className="text-xs">
                        额外赠送 {discount}%
                      </Badge>
                    )}

                    <div className="text-xs text-gray-500 mt-2">
                      约可生成 {Math.floor(pkg.totalCredits / 2)} 次单张
                    </div>
                    
                    <Button className="w-full">
                      选择此套餐
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* 购买说明 */}
          <Card className="mb-8 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-800">充值说明</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-blue-700">
              <p>• 充值任意积分包自动升级为 <Badge variant="default" className="mx-1">Pro</Badge> 用户</p>
              <p>• Pro用户享受每日签到、批量生成、最多10件服装等特权</p>
              <p>• 当前采用离线支付方式，支付后请联系管理员确认到账</p>
              <p>• 积分永不过期，可随时用于AI试穿生成</p>
              <p>• 每次单张生成消耗2积分，批量生成消耗20积分</p>
            </CardContent>
          </Card>

          {/* 购买历史 */}
          {purchaseHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>购买历史</CardTitle>
                <CardDescription>
                  您最近的积分充值记录
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {purchaseHistory.map((purchase) => (
                    <div key={purchase.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div className="flex-1">
                        <div className="font-medium">{purchase.package_name}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(purchase.created_at).toLocaleString('zh-CN')}
                        </div>
                        {purchase.admin_note && (
                          <div className="text-xs text-gray-400 mt-1">
                            备注: {purchase.admin_note}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className="font-semibold">+{purchase.credits_added} 积分</div>
                          <div className="text-sm text-gray-500">¥{purchase.amount_paid}</div>
                        </div>
                        {getStatusBadge(purchase.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        /* 支付信息页面 */
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle>确认购买</CardTitle>
            <CardDescription>
              您选择了 {selectedPackage?.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 订单信息 */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>套餐名称:</span>
                <span className="font-medium">{selectedPackage?.name}</span>
              </div>
              <div className="flex justify-between">
                <span>支付金额:</span>
                <span className="font-bold text-green-600">¥{selectedPackage?.price}</span>
              </div>
              <div className="flex justify-between">
                <span>获得积分:</span>
                <span className="font-medium">{selectedPackage?.totalCredits}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>升级等级:</span>
                <Badge variant="default">Pro用户</Badge>
              </div>
            </div>

            {/* 支付说明 */}
            <div className="text-center space-y-3">
              <div className="text-sm text-gray-600">
                当前采用离线支付方式
              </div>
              <div className="bg-yellow-50 p-3 rounded text-xs text-yellow-800">
                <p className="font-medium mb-1">支付流程:</p>
                <p>1. 点击&ldquo;确认购买&rdquo;提交订单</p>
                <p>2. 使用微信/支付宝转账给管理员</p>
                <p>3. 联系管理员确认到账</p>
                <p>4. 管理员处理后积分自动到账</p>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setShowPaymentInfo(false)}
                className="flex-1"
              >
                返回选择
              </Button>
              <Button 
                onClick={handlePurchaseSubmit}
                className="flex-1"
              >
                确认购买
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 联系方式 */}
      <Card className="mt-8 text-center bg-gray-50">
        <CardContent className="pt-6">
          <p className="text-sm text-gray-600 mb-2">
            如有问题请联系客服
          </p>
          <p className="text-xs text-gray-500">
            客服微信: xiaomaogengyi (工作时间: 9:00-18:00)
          </p>
        </CardContent>
      </Card>
    </main>
  );
}