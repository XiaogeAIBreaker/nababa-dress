'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';

interface ClothingItem {
  id: string;
  file: File;
  preview: string;
}

interface GenerationResult {
  success: boolean;
  message: string;
  data?: {
    images: string[];
    creditsUsed: number;
    generationType: string;
    generatedCount: number;
  };
  error?: string;
}

export default function Generate() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [userPhoto, setUserPhoto] = useState<File | null>(null);
  const [userPhotoPreview, setUserPhotoPreview] = useState<string>('');
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState('');
  const [generationResults, setGenerationResults] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }
  }, [status, router]);

  const getVipLimits = (userLevel?: string) => {
    switch (userLevel) {
      case 'pro':
        return {
          maxClothing: 10,
          canBatch: true,
          singleCost: 2,
          batchCost: 20,
          title: 'Pro用户'
        };
      case 'plus':
        return {
          maxClothing: 3,
          canBatch: false,
          singleCost: 2,
          batchCost: 2,
          title: 'Plus用户'
        };
      case 'free':
      default:
        return {
          maxClothing: 1,
          canBatch: false,
          singleCost: 2,
          batchCost: 2,
          title: '免费用户'
        };
    }
  };

  const vipLimits = getVipLimits(session?.user?.userLevel);
  const currentCredits = session?.user?.credits || 0;

  // 将文件转换为base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleUserPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUserPhoto(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setUserPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClothingUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (clothingItems.length >= vipLimits.maxClothing) {
        alert(`${vipLimits.title}最多可上传 ${vipLimits.maxClothing} 件服装`);
        return;
      }

      const id = Math.random().toString(36).substr(2, 9);
      const reader = new FileReader();
      reader.onload = (e) => {
        const newItem: ClothingItem = {
          id,
          file,
          preview: e.target?.result as string
        };
        setClothingItems(prev => [...prev, newItem]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeClothingItem = (id: string) => {
    setClothingItems(prev => prev.filter(item => item.id !== id));
  };

  const calculateCost = () => {
    if (clothingItems.length === 0) return 0;
    
    // Pro用户批量生成
    if (vipLimits.canBatch && clothingItems.length > 1) {
      return vipLimits.batchCost;
    }
    
    // 单次生成
    return vipLimits.singleCost;
  };

  const canGenerate = () => {
    if (!userPhoto || clothingItems.length === 0) return false;
    if (currentCredits < calculateCost()) return false;
    return true;
  };

  const handleGenerate = async () => {
    if (!canGenerate() || !userPhoto || clothingItems.length === 0) return;

    setGenerating(true);
    setProgress(0);
    setGenerationStatus('正在上传图片...');
    setShowResults(false);
    setGenerationResults([]);

    try {
      // 转换图片为base64
      setGenerationStatus('正在处理图片...');
      setProgress(20);
      
      const userImageBase64 = await fileToBase64(userPhoto);
      const clothingImagesBase64 = await Promise.all(
        clothingItems.map(item => fileToBase64(item.file))
      );

      setGenerationStatus('正在分析照片...');
      setProgress(40);

      // 准备请求数据
      const requestData = {
        userImage: userImageBase64,
        clothingImages: clothingImagesBase64,
        generationType: clothingItems.length > 1 && vipLimits.canBatch ? 'batch' : 'single'
      };

      setGenerationStatus('正在生成图片...');
      setProgress(60);

      // 调用生成API
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const result: GenerationResult = await response.json();

      setProgress(100);
      setGenerationStatus('生成完成');

      if (result.success && result.data) {
        // 生成成功
        setGenerationResults(result.data.images);
        setShowResults(true);
        
        // 更新session中的积分（手动刷新）
        await update();
        
        setTimeout(() => {
          setGenerating(false);
          setProgress(0);
          setGenerationStatus('');
        }, 1500);
      } else {
        // 生成失败
        throw new Error(result.message || '生成失败');
      }

    } catch (error) {
      console.error('生成失败:', error);
      setGenerationStatus('生成失败，积分已退还');
      
      // 刷新session以更新积分
      await update();
      
      setTimeout(() => {
        setGenerating(false);
        setProgress(0);
        setGenerationStatus('');
        alert(error instanceof Error ? error.message : '生成失败，请稍后重试');
      }, 2000);
    }
  };

  if (status === 'loading') {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 bg-gray-200 rounded"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          AI虚拟试穿
        </h1>
        <p className="text-gray-600">
          上传您的照片和服装，AI为您生成逼真的试穿效果
        </p>
      </div>

      {/* 用户状态 */}
      <Card className="mb-8 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Badge variant={session.user.userLevel === 'pro' ? 'default' : session.user.userLevel === 'plus' ? 'info' : 'secondary'}>
                {vipLimits.title}
              </Badge>
              <span className="text-sm text-gray-600">
                当前积分: <span className="font-semibold text-green-600">{currentCredits}</span>
              </span>
              <span className="text-sm text-gray-600">
                最多 {vipLimits.maxClothing} 件服装
              </span>
            </div>
            
            <div className="flex items-center space-x-2 text-sm">
              {session.user.userLevel === 'free' && (
                <Link href="/upgrade">
                  <Button variant="outline" size="sm">升级Plus</Button>
                </Link>
              )}
              {(session.user.userLevel === 'free' || session.user.userLevel === 'plus') && (
                <Link href="/purchase">
                  <Button variant="outline" size="sm">充值积分</Button>
                </Link>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {generating && (
        <Card className="mb-8 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h3 className="font-medium text-green-800">{generationStatus}</h3>
              <Progress value={progress} className="w-full h-3" />
              <p className="text-sm text-green-600">
                请耐心等待，生成时间约30-60秒
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {showResults && generationResults.length > 0 && (
        <Card className="mb-8 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">🎉 生成完成！</CardTitle>
            <CardDescription>
              成功生成 {generationResults.length} 张试穿图片
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {generationResults.map((imageUrl, index) => (
                <div key={index} className="relative">
                  <img 
                    src={imageUrl} 
                    alt={`生成结果 ${index + 1}`}
                    className="w-full h-64 object-cover rounded-lg border"
                  />
                  <div className="absolute top-2 right-2 bg-white bg-opacity-90 px-2 py-1 rounded text-xs font-medium">
                    {index + 1}/{generationResults.length}
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {generationResults.map((imageUrl, index) => (
                  <a
                    key={index}
                    href={imageUrl}
                    download={`ai-tryon-result-${index + 1}.jpg`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 min-w-0"
                  >
                    <Button variant="outline" size="sm" className="w-full">
                      下载图片 {index + 1}
                    </Button>
                  </a>
                ))}
              </div>
              <Button 
                onClick={() => setShowResults(false)}
                variant="outline" 
                className="w-full"
              >
                生成更多图片
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 上传区域 */}
        <div className="space-y-6">
          {/* 用户照片上传 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>📷</span>
                <span>上传您的照片</span>
              </CardTitle>
              <CardDescription>
                建议上传正面清晰的全身照片，效果更佳
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userPhotoPreview ? (
                  <div className="relative">
                    <img 
                      src={userPhotoPreview} 
                      alt="用户照片预览" 
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    <Button 
                      variant="destructive" 
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setUserPhoto(null);
                        setUserPhotoPreview('');
                      }}
                    >
                      删除
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                    <div className="text-4xl mb-4">📷</div>
                    <p className="text-gray-600 mb-4">点击或拖拽上传您的照片</p>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleUserPhotoUpload}
                      className="hidden"
                      id="userPhoto"
                      disabled={generating}
                    />
                    <Button variant="outline" asChild disabled={generating}>
                      <label htmlFor="userPhoto" className="cursor-pointer">
                        选择照片
                      </label>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 服装上传 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span>👗</span>
                  <span>上传服装</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {clothingItems.length}/{vipLimits.maxClothing}
                </Badge>
              </CardTitle>
              <CardDescription>
                {vipLimits.title}最多可上传 {vipLimits.maxClothing} 件服装
                {vipLimits.canBatch && clothingItems.length > 1 && (
                  <span className="text-green-600 ml-2">（将进行批量生成）</span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* 服装预览网格 */}
                {clothingItems.length > 0 && (
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {clothingItems.map((item) => (
                      <div key={item.id} className="relative">
                        <img 
                          src={item.preview} 
                          alt="服装预览" 
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <Button 
                          variant="destructive" 
                          size="sm"
                          className="absolute top-1 right-1 h-6 w-6 p-0"
                          onClick={() => removeClothingItem(item.id)}
                          disabled={generating}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* 上传按钮 */}
                {clothingItems.length < vipLimits.maxClothing && (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                    <div className="text-3xl mb-2">👗</div>
                    <p className="text-gray-600 mb-3">添加服装图片</p>
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleClothingUpload}
                      className="hidden"
                      id="clothingUpload"
                      disabled={generating}
                    />
                    <Button variant="outline" asChild disabled={generating}>
                      <label htmlFor="clothingUpload" className="cursor-pointer">
                        选择服装
                      </label>
                    </Button>
                  </div>
                )}

                {clothingItems.length >= vipLimits.maxClothing && (
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <p className="text-yellow-800 text-sm">
                      已达到 {vipLimits.title} 的服装上传上限
                    </p>
                    {session.user.userLevel !== 'pro' && (
                      <Link href="/purchase">
                        <Button variant="outline" size="sm" className="mt-2">
                          升级到Pro解锁更多
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 生成控制 */}
        <div className="space-y-6">
          {/* 生成预览 */}
          <Card>
            <CardHeader>
              <CardTitle>生成预览</CardTitle>
              <CardDescription>
                确认信息无误后开始生成
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 成本计算 */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>用户照片:</span>
                  <span className={userPhoto ? 'text-green-600' : 'text-gray-400'}>
                    {userPhoto ? '✓ 已上传' : '未上传'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>服装数量:</span>
                  <span className={clothingItems.length > 0 ? 'text-green-600' : 'text-gray-400'}>
                    {clothingItems.length} 件
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>生成模式:</span>
                  <span className="font-medium">
                    {vipLimits.canBatch && clothingItems.length > 1 ? '批量生成' : '单次生成'}
                  </span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-2">
                  <span>消耗积分:</span>
                  <span className="text-green-600">{calculateCost()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>剩余积分:</span>
                  <span className={currentCredits >= calculateCost() ? 'text-green-600' : 'text-red-600'}>
                    {currentCredits - calculateCost()}
                  </span>
                </div>
              </div>

              {/* 生成按钮 */}
              <div className="space-y-3">
                {!canGenerate() && (
                  <div className="text-sm text-gray-600 space-y-1">
                    {!userPhoto && <p>• 请上传您的照片</p>}
                    {clothingItems.length === 0 && <p>• 请至少上传一件服装</p>}
                    {currentCredits < calculateCost() && (
                      <p className="text-red-600">• 积分不足，需要 {calculateCost()} 积分</p>
                    )}
                  </div>
                )}

                <Button 
                  className="w-full h-12 text-lg"
                  onClick={handleGenerate}
                  disabled={!canGenerate() || generating}
                >
                  {generating ? (
                    <span>{generationStatus}</span>
                  ) : (
                    <span>开始生成 ({calculateCost()} 积分)</span>
                  )}
                </Button>

                {currentCredits < calculateCost() && (
                  <Link href="/purchase">
                    <Button variant="outline" className="w-full">
                      充值积分
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>

          {/* VIP特权说明 */}
          <Card className="bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-800">
                {vipLimits.title}特权
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-blue-700">
              <p>• 单次生成消耗 {vipLimits.singleCost} 积分</p>
              {vipLimits.canBatch ? (
                <p>• 批量生成消耗 {vipLimits.batchCost} 积分（多件服装一次生成）</p>
              ) : (
                <p>• 每件服装单独生成，消耗 {vipLimits.singleCost} 积分</p>
              )}
              <p>• 最多可上传 {vipLimits.maxClothing} 件服装</p>
              <p>• 生成失败自动退还积分</p>
              
              {session.user.userLevel === 'free' && (
                <div className="pt-2 border-t border-blue-200">
                  <p className="font-medium">升级Plus解锁:</p>
                  <p>• 最多3件服装，每日签到</p>
                  <Link href="/upgrade">
                    <Button variant="outline" size="sm" className="mt-2">
                      免费升级Plus
                    </Button>
                  </Link>
                </div>
              )}
              
              {session.user.userLevel !== 'pro' && (
                <div className="pt-2 border-t border-blue-200">
                  <p className="font-medium">升级Pro解锁:</p>
                  <p>• 最多10件服装，批量生成，专属客服</p>
                  <Link href="/purchase">
                    <Button variant="outline" size="sm" className="mt-2">
                      充值升级Pro
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 使用提示 */}
      <Card className="mt-8 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-yellow-800">使用技巧</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-yellow-700 space-y-2">
          <p>• 上传正面、清晰、光线充足的全身照效果最佳</p>
          <p>• 服装图片建议使用平铺或模特展示图</p>
          <p>• 避免复杂背景，纯色背景效果更好</p>
          <p>• 每次生成大约需要30-60秒，请耐心等待</p>
          <p>• 如果生成失败，积分会自动退还</p>
        </CardContent>
      </Card>
    </main>
  );
}