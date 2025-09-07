'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function Header() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const getVipBadgeVariant = (userLevel?: string) => {
    switch (userLevel) {
      case 'pro':
        return 'default';
      case 'plus':
        return 'info';
      case 'free':
      default:
        return 'secondary';
    }
  };

  const getVipBadgeText = (userLevel?: string) => {
    switch (userLevel) {
      case 'pro':
        return 'Pro';
      case 'plus':
        return 'Plus';
      case 'free':
      default:
        return 'Free';
    }
  };

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/');
  };

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold text-gray-900">
          小猫更衣
        </Link>

        {/* Navigation & User Info */}
        {status === 'loading' ? (
          <div className="h-8 w-32 bg-gray-200 animate-pulse rounded"></div>
        ) : session?.user ? (
          <div className="flex items-center space-x-4">
            {/* Navigation Links */}
            <nav className="hidden md:flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                控制台
              </Link>
              <Link href="/generate" className="text-gray-600 hover:text-gray-900">
                AI试穿
              </Link>
              <Link href="/purchase" className="text-gray-600 hover:text-gray-900">
                积分充值
              </Link>
              <Link href="/profile" className="text-gray-600 hover:text-gray-900">
                个人中心
              </Link>
            </nav>

            {/* User Status */}
            <div className="flex items-center space-x-3">
              {/* Credits Display */}
              <div className="flex items-center space-x-1 text-sm">
                <span className="text-gray-600">积分:</span>
                <span className="font-semibold text-green-600">
                  {session.user.credits || 0}
                </span>
              </div>

              {/* VIP Badge */}
              <Badge variant={getVipBadgeVariant(session.user.userLevel)}>
                {getVipBadgeText(session.user.userLevel)}
              </Badge>

              {/* User Email */}
              <span className="text-sm text-gray-600 hidden lg:inline">
                {session.user.email}
              </span>

              {/* Sign Out Button */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSignOut}
              >
                退出
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Link href="/auth/signin">
              <Button variant="outline" size="sm">
                登录
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm">
                注册
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Mobile Navigation */}
      {session?.user && (
        <div className="md:hidden border-t bg-gray-50 px-4 py-2">
          <nav className="flex justify-around">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 text-sm">
              控制台
            </Link>
            <Link href="/generate" className="text-gray-600 hover:text-gray-900 text-sm">
              AI试穿
            </Link>
            <Link href="/purchase" className="text-gray-600 hover:text-gray-900 text-sm">
              充值
            </Link>
            <Link href="/profile" className="text-gray-600 hover:text-gray-900 text-sm">
              个人
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}