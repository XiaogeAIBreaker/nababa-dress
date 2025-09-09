'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChatContainer } from '@/components/chat/chat-container';
import { ChatMessage } from '@/components/chat/chat-message';
import { GenerationProgress } from '@/components/chat/generation-progress';
import { FileUpload } from '@/components/chat/file-upload';
import { CatSpeechSystem } from '@/components/ai/cat-assistant';
import { SuccessCelebration } from '@/components/animations/success-celebration';
import { useUserData } from '@/hooks/useUserData';
import { useErrorHandler } from '@/components/ui/toast';
import { useIsClient } from '@/hooks/useIsClient';
import { getVipLimits, calculateRequiredCredits } from '@/lib/vip-utils';
import type { UserLevel, GenerationResult } from '@/types';

interface ChatStep {
  id: string;
  type: 'greeting' | 'photo_upload' | 'photo_received' | 'clothing_upload' | 'clothing_received' | 'generating' | 'result' | 'continue';
  timestamp: Date;
}

interface UploadedFile {
  file: File;
  preview: string;
}

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { user, isLoading, isAuthenticated, refreshSession, credits } = useUserData();
  const { handleError, toast } = useErrorHandler();
  const isClient = useIsClient();
  
  // 聊天状态
  const [chatSteps, setChatSteps] = useState<ChatStep[]>([]);
  const [currentStep, setCurrentStep] = useState<ChatStep['type']>('greeting');
  
  // 上传文件状态
  const [userPhoto, setUserPhoto] = useState<UploadedFile | null>(null);
  const [clothingItems, setClothingItems] = useState<UploadedFile[]>([]);
  
  // 生成状态
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationResults, setGenerationResults] = useState<string[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);

  const userLevel = (user?.userLevel || 'free') as UserLevel;
  const vipLimits = getVipLimits(userLevel);

  // 初始化聊天 - 显示问候语（无论是否登录）
  useEffect(() => {
    if (chatSteps.length === 0) {
      const greeting: ChatStep = {
        id: 'greeting',
        type: 'greeting',
        timestamp: new Date()
      };
      setChatSteps([greeting]);
    }
  }, [chatSteps.length]);

  // 获取首页定制问候语
  const getHomeGreeting = (userName?: string): string => {
    const greetings = [
      `嗨，小仙女${userName ? ` ${userName}` : ''}！✨ 欢迎来到AI试穿世界～上传你的照片开始魔法变装吧！`,
      `欢迎来到小猫更衣呀～${userName ? ` ${userName}` : '小可爱'}！🐱 准备好体验AI试穿魔法了吗？`,
      `哇！${userName ? userName : '小仙女'}！💕 今天想试什么搭配呢？上传照片让AI帮你实现梦想造型～`,
      `小猫很开心见到你～${userName ? userName : '宝贝'}！😽 快来体验AI试穿的神奇效果吧！`
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  };

  // 文件转换工具
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const createFilePreview = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // 步骤管理
  const addChatStep = (type: ChatStep['type']) => {
    const newStep: ChatStep = {
      id: `${type}_${Date.now()}`,
      type,
      timestamp: new Date()
    };
    setChatSteps(prev => [...prev, newStep]);
    setCurrentStep(type);
  };

  // 用户照片上传处理
  const handleUserPhotoUpload = async (files: File[]) => {
    const file = files[0];
    if (!file) return;

    try {
      const preview = await createFilePreview(file);
      setUserPhoto({ file, preview });
      
      // 添加用户上传照片的聊天记录
      addChatStep('photo_received');
      
      // 延迟一下，然后显示AI回应
      setTimeout(() => {
        addChatStep('clothing_upload');
      }, 1000);
    } catch (error) {
      handleError(error, '照片处理');
    }
  };

  // 服装上传处理
  const handleClothingUpload = async (files: File[]) => {
    if (clothingItems.length >= vipLimits.maxClothingItems) {
      toast.warning(`当前等级最多可上传 ${vipLimits.maxClothingItems} 件服装`);
      return;
    }

    const newClothingItems: UploadedFile[] = [];
    
    for (const file of files.slice(0, vipLimits.maxClothingItems - clothingItems.length)) {
      try {
        const preview = await createFilePreview(file);
        newClothingItems.push({ file, preview });
      } catch (error) {
        handleError(error, '服装图片处理');
      }
    }

    if (newClothingItems.length > 0) {
      setClothingItems(prev => [...prev, ...newClothingItems]);
      
      // 添加用户上传服装的聊天记录
      addChatStep('clothing_received');
    }
  };

  // 登录检查和触发
  const requireLogin = () => {
    if (!isAuthenticated) {
      toast.info('请先登录以开始AI生成', '登录提醒');
      router.push('/auth/signin');
      return false;
    }
    return true;
  };

  // AI生成处理（需要登录）
  const handleGenerate = async () => {
    // 在生成时才检查登录状态
    if (!requireLogin()) return;

    if (!userPhoto || clothingItems.length === 0) {
      toast.error('请先上传照片和服装图片');
      return;
    }

    const requiredCredits = calculateRequiredCredits(userLevel, clothingItems.length);
    if (credits < requiredCredits) {
      toast.error(`积分不足！需要 ${requiredCredits} 积分，当前只有 ${credits} 积分`);
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    addChatStep('generating');

    try {
      // 模拟进度更新
      const progressTimer = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressTimer);
            return 95;
          }
          return prev + Math.random() * 15;
        });
      }, 800);

      // 转换图片为base64
      const userImageBase64 = await fileToBase64(userPhoto.file);
      const clothingImagesBase64 = await Promise.all(
        clothingItems.map(item => fileToBase64(item.file))
      );

      // 调用生成API
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userImage: userImageBase64,
          clothingImages: clothingImagesBase64,
          generationType: clothingItems.length > 1 && vipLimits.canBatchGenerate ? 'batch' : 'single'
        }),
      });

      const result: GenerationResult = await response.json();
      clearInterval(progressTimer);
      setGenerationProgress(100);

      if (result.success && result.data) {
        setGenerationResults(result.data.images);
        await refreshSession();
        
        setTimeout(() => {
          setIsGenerating(false);
          setShowCelebration(true);
          addChatStep('result');
        }, 1000);
      } else {
        throw new Error(result.message || '生成失败');
      }

    } catch (error) {
      setIsGenerating(false);
      handleError(error, 'AI生成');
      await refreshSession(); // 刷新以更新退还的积分
    }
  };

  const startNewGeneration = () => {
    setUserPhoto(null);
    setClothingItems([]);
    setGenerationResults([]);
    setChatSteps([]);
    setCurrentStep('greeting');
    
    // 重新开始对话
    setTimeout(() => {
      const greeting: ChatStep = {
        id: 'greeting_new',
        type: 'greeting', 
        timestamp: new Date()
      };
      setChatSteps([greeting]);
    }, 500);
  };

  // 渲染加载状态
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="cat-card p-8 text-center">
          <div className="text-4xl mb-4 cat-pulse">🐱</div>
          <p className="cat-text-muted">正在加载小猫助手...</p>
        </div>
      </div>
    );
  }


  // 获取当前需要显示的内容
  const getCurrentStepContent = () => {
    if (currentStep === 'greeting' && !userPhoto) {
      return (
        <div className="px-4 space-y-4">
          <FileUpload
            type="photo"
            onFilesSelected={handleUserPhotoUpload}
            disabled={isGenerating}
          />

          {/* 使用小贴士 */}
          <div className="cat-card p-4 bg-gradient-to-r from-pink-50 to-purple-50">
            <h4 className="font-medium text-gray-800 mb-3 flex items-center">
              💡 使用小贴士
            </h4>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• <strong>拍照效果更佳：</strong>选择光线良好的环境，避免背光</p>
              <p>• <strong>姿势建议：</strong>正面站立，双臂自然下垂或微张</p>
              <p>• <strong>服装选择：</strong>平铺展示图或模特试穿图效果最好</p>
            </div>
          </div>
        </div>
      );
    }

    if (currentStep === 'clothing_upload' && userPhoto && clothingItems.length === 0) {
      return (
        <div className="px-4 space-y-4">
          <FileUpload
            type="clothing"
            multiple={vipLimits.maxClothingItems > 1}
            maxFiles={vipLimits.maxClothingItems}
            onFilesSelected={handleClothingUpload}
            disabled={isGenerating}
          />

          {/* VIP等级提示 */}
          <div className="cat-card p-4 bg-gradient-to-r from-blue-50 to-pink-50">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-800">
                🎯 当前等级权限
              </h4>
              <span className="text-xs bg-pink-100 text-pink-600 px-2 py-1 rounded-full">
                {userLevel.toUpperCase()}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              <p>• 可同时上传 <strong>{vipLimits.maxClothingItems}</strong> 件服装</p>
              {vipLimits.canBatchGenerate ? (
                <p>• 支持批量生成，一次处理多件服装</p>
              ) : (
                <p>• 升级到Pro可享受批量生成功能</p>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (userPhoto && clothingItems.length > 0 && !isGenerating && generationResults.length === 0) {
      const requiredCredits = calculateRequiredCredits(userLevel, clothingItems.length);
      const canGenerate = isAuthenticated && credits >= requiredCredits;
      
      return (
        <div className="px-4">
          <div className="cat-card p-4">
            <h3 className="font-semibold mb-3">✨ 准备生成专属试穿效果</h3>
            
            {!isAuthenticated ? (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl mb-3 cat-bounce">🎭</div>
                  <p className="text-gray-700 font-medium mb-2">
                    准备好见证AI魔法了吗？
                  </p>
                  <p className="text-sm text-gray-600">
                    登录后即可开始生成，看看AI为你创造的惊喜效果！
                  </p>
                </div>
                
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-4 rounded-xl">
                  <div className="flex items-center mb-2">
                    <span className="text-lg mr-2">🎁</span>
                    <span className="font-medium text-gray-800">新用户福利</span>
                  </div>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• 免费注册即送6积分</li>
                    <li>• 可立即体验AI试穿功能</li>
                    <li>• 保存历史作品，随时查看</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <Link href="/auth/signin">
                    <Button className="cat-gradient-button w-full touch-target">
                      🚀 登录开始体验
                    </Button>
                  </Link>
                  
                  <Link href="/auth/signup">
                    <Button variant="outline" className="w-full touch-target border-pink-300 text-pink-600 hover:bg-pink-50">
                      ✨ 免费注册领积分
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                  <div className="flex justify-between">
                    <span>消耗积分:</span>
                    <span className="font-semibold text-pink-600">{requiredCredits}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>当前积分:</span>
                    <span className={credits >= requiredCredits ? 'text-green-600' : 'text-red-600'}>
                      {credits}
                    </span>
                  </div>
                </div>
                
                {canGenerate ? (
                  <Button 
                    onClick={handleGenerate}
                    className="cat-gradient-button w-full touch-target"
                  >
                    🎨 开始生成 ({requiredCredits} 积分)
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl mb-3 cat-bounce">💰</div>
                      <p className="text-gray-700 font-medium mb-2">
                        哎呀，积分不太够呢～
                      </p>
                      <p className="text-sm text-gray-600">
                        需要 <span className="font-semibold text-pink-600">{requiredCredits}</span> 积分，
                        当前有 <span className="font-semibold">{credits}</span> 积分
                      </p>
                    </div>
                    
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-xl">
                      <div className="flex items-center mb-2">
                        <span className="text-lg mr-2">💡</span>
                        <span className="font-medium text-gray-800">获取积分方式</span>
                      </div>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• 每日签到获得免费积分</li>
                        <li>• 充值积分包，性价比更高</li>
                        <li>• 升级VIP享受更多权益</li>
                      </ul>
                    </div>

                    <Button 
                      onClick={() => {
                        if (isClient && typeof window !== 'undefined') {
                          window.open('/purchase', '_blank');
                        } else {
                          router.push('/purchase');
                        }
                      }}
                      className="cat-gradient-button w-full touch-target"
                    >
                      💎 立即充值积分
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="h-full flex flex-col bg-transparent">
      {/* 聊天消息区域 */}
      <ChatContainer className="flex-1">
        {chatSteps.map((step) => {
          switch (step.type) {
            case 'greeting':
              return (
                <ChatMessage
                  key={step.id}
                  type="ai"
                  content={getHomeGreeting(session?.user?.name || undefined)}
                  userLevel={userLevel}
                  timestamp={step.timestamp}
                />
              );

            case 'photo_received':
              if (!userPhoto) return null;
              return (
                <div key={step.id}>
                  <ChatMessage
                    type="user"
                    images={[userPhoto.preview]}
                    timestamp={step.timestamp}
                  />
                  <ChatMessage
                    type="ai"
                    content={CatSpeechSystem.getPhotoCompliment()}
                    userLevel={userLevel}
                    timestamp={new Date(step.timestamp.getTime() + 1000)}
                  />
                </div>
              );

            case 'clothing_received':
              return (
                <div key={step.id}>
                  <ChatMessage
                    type="user"
                    images={clothingItems.map(item => item.preview)}
                    timestamp={step.timestamp}
                  />
                  <ChatMessage
                    type="ai"
                    content={CatSpeechSystem.getClothingApproval('服装')}
                    userLevel={userLevel}
                    timestamp={new Date(step.timestamp.getTime() + 1000)}
                  />
                </div>
              );

            case 'generating':
              return (
                <GenerationProgress
                  key={step.id}
                  isGenerating={isGenerating}
                  progress={generationProgress}
                  onComplete={() => {}}
                />
              );

            case 'result':
              return (
                <div key={step.id}>
                  <ChatMessage
                    type="ai"
                    content={CatSpeechSystem.getSuccessMessage()}
                    userLevel={userLevel}
                    timestamp={step.timestamp}
                  />
                  {generationResults.length > 0 && (
                    <div className="mx-4 mb-6">
                      <div className="cat-card p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          {generationResults.map((imageUrl, index) => (
                            <div key={index} className="relative">
                              <Image 
                                src={imageUrl} 
                                alt={`生成结果 ${index + 1}`}
                                width={300}
                                height={400}
                                className="w-full h-auto rounded-xl"
                                unoptimized={imageUrl.startsWith('data:')}
                              />
                              <div className="absolute top-2 right-2 bg-pink-500 text-white px-2 py-1 rounded-full text-xs">
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
                                download={`小猫更衣-试穿效果-${index + 1}.jpg`}
                                className="flex-1 min-w-[120px]"
                              >
                                <Button variant="outline" size="sm" className="w-full touch-target border-pink-300 text-pink-600">
                                  📱 保存图片 {index + 1}
                                </Button>
                              </a>
                            ))}
                          </div>
                          <Button 
                            onClick={startNewGeneration}
                            className="cat-gradient-button w-full touch-target"
                          >
                            🎨 再次生成
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  <ChatMessage
                    type="ai"
                    content={CatSpeechSystem.getContinueInvite()}
                    userLevel={userLevel}
                    timestamp={new Date(step.timestamp.getTime() + 2000)}
                  />
                </div>
              );

            default:
              return null;
          }
        })}
      </ChatContainer>

      {/* 当前步骤的交互内容 */}
      {getCurrentStepContent()}

      {/* 底部安全区域 */}
      <div className="safe-area-bottom h-4" />

      {/* 成功庆祝动画 */}
      <SuccessCelebration 
        trigger={showCelebration}
        onComplete={() => setShowCelebration(false)}
      />
    </div>
  );
}