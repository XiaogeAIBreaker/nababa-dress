'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VipBadge } from '@/components/user/vip-badge';
import { CreditsDisplay } from '@/components/user/credits-display';
import { useUserData } from '@/hooks/useUserData';
import { useErrorHandler } from '@/components/ui/toast';
import type { UserLevel } from '@/types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { data: session, status } = useSession();
  const { user, credits } = useUserData();
  const router = useRouter();
  const { toast } = useErrorHandler();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut({ redirect: false });
      onClose();
      router.push('/');
      toast.success('已安全退出登录');
    } catch (error) {
      toast.error('退出登录失败');
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleLinkClick = () => {
    onClose();
  };

  const userLevel = (user?.userLevel || 'free') as UserLevel;

  if (status === 'loading') {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-16 bg-pink-100 rounded-2xl"></div>
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 bg-pink-100 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="p-6 h-full flex flex-col">
        <div className="flex items-center justify-center mb-8">
          <div className="text-4xl cat-pulse">🐱</div>
          <div className="ml-3">
            <h2 className="text-xl font-bold gradient-pink-glow bg-clip-text text-transparent">
              小猫更衣
            </h2>
            <p className="text-sm cat-text-muted">AI虚拟试穿</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center space-y-4">
          <div className="text-center mb-6">
            <p className="text-pink-600 mb-2">✨ 欢迎来到小猫更衣</p>
            <p className="text-sm cat-text-muted">登录后开始您的AI试穿之旅</p>
          </div>
          
          <Link href="/auth/signin" onClick={handleLinkClick}>
            <Button className="w-full cat-gradient-button touch-target">
              立即登录
            </Button>
          </Link>
          
          <Link href="/auth/signup" onClick={handleLinkClick}>
            <Button variant="outline" className="w-full touch-target border-pink-300 text-pink-600 hover:bg-pink-50">
              免费注册
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* 用户信息区域 */}
      <div className="p-6 border-b border-pink-200">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-pink-500 rounded-full flex items-center justify-center text-white text-xl font-bold cat-pulse">
            🐱
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-gray-800 truncate">
                {session.user.name || session.user.email?.split('@')[0] || '用户'}
              </h3>
              <VipBadge userLevel={userLevel} />
            </div>
            <p className="text-sm cat-text-muted truncate">
              {session.user.email}
            </p>
          </div>
        </div>
        
        <div className="bg-white/50 rounded-xl p-3">
          <CreditsDisplay credits={credits} size="sm" showIcon />
        </div>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 px-3 py-4 space-y-2">
        <Link href="/dashboard" onClick={handleLinkClick}>
          <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/50 transition-colors touch-target">
            <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
              📊
            </div>
            <span className="font-medium text-gray-700">控制台</span>
          </div>
        </Link>

        <Link href="/generate" onClick={handleLinkClick}>
          <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/50 transition-colors touch-target">
            <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
              ✨
            </div>
            <span className="font-medium text-gray-700">AI试穿</span>
            <Badge variant="secondary" className="ml-auto bg-pink-100 text-pink-600 text-xs">
              核心
            </Badge>
          </div>
        </Link>

        <Link href="/profile" onClick={handleLinkClick}>
          <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/50 transition-colors touch-target">
            <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
              👤
            </div>
            <span className="font-medium text-gray-700">个人中心</span>
          </div>
        </Link>

        <div className="border-t border-pink-200 pt-2 mt-4">
          <Link href="/purchase" onClick={handleLinkClick}>
            <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/50 transition-colors touch-target">
              <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-pink-500 rounded-lg flex items-center justify-center text-white">
                💎
              </div>
              <span className="font-medium text-gray-700">积分充值</span>
              <Badge variant="default" className="ml-auto bg-pink-500 text-xs">
                升级Pro
              </Badge>
            </div>
          </Link>

          {userLevel === 'free' && (
            <Link href="/upgrade" onClick={handleLinkClick}>
              <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/50 transition-colors touch-target">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  📱
                </div>
                <span className="font-medium text-gray-700">微信升级</span>
                <Badge variant="info" className="ml-auto text-xs bg-blue-100 text-blue-600">
                  免费
                </Badge>
              </div>
            </Link>
          )}
        </div>

        <div className="border-t border-pink-200 pt-2 mt-4">
          <button 
            onClick={() => {
              onClose();
              // 这里可以添加设置页面导航
            }}
            className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-white/50 transition-colors touch-target"
          >
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              ⚙️
            </div>
            <span className="font-medium text-gray-700">设置</span>
          </button>

          <button 
            onClick={() => {
              onClose();
              // 这里可以添加反馈功能
              toast.info('感谢您的反馈！我们会认真对待每一条建议 💕');
            }}
            className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-white/50 transition-colors touch-target"
          >
            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
              💌
            </div>
            <span className="font-medium text-gray-700">意见反馈</span>
          </button>
        </div>
      </nav>

      {/* 底部退出按钮 */}
      <div className="p-4 border-t border-pink-200">
        <Button 
          variant="outline" 
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="w-full touch-target border-pink-300 text-pink-600 hover:bg-pink-50"
        >
          {isSigningOut ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-pink-300 border-t-pink-600 rounded-full animate-spin"></div>
              <span>退出中...</span>
            </div>
          ) : (
            '🚪 退出登录'
          )}
        </Button>
      </div>
    </div>
  );
}