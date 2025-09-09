'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
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

export default function Generate() {
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

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }
  }, [status, router]);

  // 初始化聊天 - 显示问候语
  useEffect(() => {
    if (isAuthenticated && chatSteps.length === 0) {
      const greeting: ChatStep = {
        id: 'greeting',
        type: 'greeting',
        timestamp: new Date()
      };
      setChatSteps([greeting]);
    }
  }, [isAuthenticated, chatSteps.length]);

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
      
      // 延迟一下，然后可以开始生成
      setTimeout(() => {
        // 这里可以直接显示生成按钮或者询问是否开始生成
      }, 1000);
    }
  };

  // AI生成处理
  const handleGenerate = async () => {
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

  // 未登录重定向
  if (!isAuthenticated) {
    return null;
  }

  // 获取当前需要显示的内容
  const getCurrentStepContent = () => {
    if (currentStep === 'greeting' && !userPhoto) {
      return (
        <div className="px-4">
          <FileUpload
            type="photo"
            onFilesSelected={handleUserPhotoUpload}
            disabled={isGenerating}
          />
        </div>
      );
    }

    if (currentStep === 'clothing_upload' && userPhoto && clothingItems.length === 0) {
      return (
        <div className="px-4">
          <FileUpload
            type="clothing"
            multiple={vipLimits.maxClothingItems > 1}
            maxFiles={vipLimits.maxClothingItems}
            onFilesSelected={handleClothingUpload}
            disabled={isGenerating}
          />
        </div>
      );
    }

    if (userPhoto && clothingItems.length > 0 && !isGenerating && generationResults.length === 0) {
      const requiredCredits = calculateRequiredCredits(userLevel, clothingItems.length);
      const canGenerate = credits >= requiredCredits;
      
      return (
        <div className="px-4">
          <div className="cat-card p-4">
            <h3 className="font-semibold mb-3">✨ 准备生成专属试穿效果</h3>
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
              <div className="space-y-3">
                <p className="text-red-600 text-sm text-center">
                  {CatSpeechSystem.getInsufficientCreditsMessage(requiredCredits, credits)}
                </p>
                <Button 
                  onClick={() => {
                    if (isClient && typeof window !== 'undefined') {
                      window.open('/purchase', '_blank');
                    } else {
                      // 降级方案：使用路由跳转
                      router.push('/purchase');
                    }
                  }}
                  className="cat-gradient-button w-full touch-target"
                >
                  💎 去充值积分
                </Button>
              </div>
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
                  content={CatSpeechSystem.getGreeting(session?.user?.name || undefined)}
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