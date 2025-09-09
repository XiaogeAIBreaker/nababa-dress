'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CreditsDisplay } from '@/components/user/credits-display';
import { Drawer } from '@/components/ui/drawer';
import { Sidebar } from '@/components/navigation/sidebar';
import { useUserData } from '@/hooks/useUserData';

export function Header() {
  const { data: session, status } = useSession();
  const { credits } = useUserData();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <>
      <header className="gradient-pink-soft border-b border-pink-200/50 safe-area-top">
        <div className="px-4 py-3 flex items-center justify-between">
          {/* 左侧：菜单按钮 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="touch-target hover:bg-white/50 text-pink-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </Button>

          {/* 中央：Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <motion.div 
              className="text-2xl"
              whileHover={{ 
                scale: 1.2,
                rotate: [0, -10, 10, 0],
                transition: { duration: 0.3 }
              }}
              whileTap={{ scale: 0.9 }}
            >
              🐱
            </motion.div>
            <motion.span 
              className="text-xl font-bold gradient-pink-glow bg-clip-text text-transparent"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              小猫更衣
            </motion.span>
          </Link>

          {/* 右侧：积分显示或登录按钮 */}
          {status === 'loading' ? (
            <div className="w-20 h-8 bg-pink-100 animate-pulse rounded-xl"></div>
          ) : session?.user ? (
            <CreditsDisplay credits={credits} size="sm" />
          ) : (
            <Link href="/auth/signin">
              <Button size="sm" className="cat-gradient-button touch-target text-sm">
                登录
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* 侧边抽屉 */}
      <Drawer isOpen={isSidebarOpen} onClose={closeSidebar} side="left">
        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      </Drawer>
    </>
  );
}