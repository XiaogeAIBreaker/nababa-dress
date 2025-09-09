'use client';

import { useEffect, useRef, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useIsClient } from '@/hooks/useIsClient';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  side?: 'left' | 'right';
  className?: string;
}

export function Drawer({ 
  isOpen, 
  onClose, 
  children, 
  side = 'left',
  className = '' 
}: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const isClient = useIsClient();

  useEffect(() => {
    if (!isClient) return;

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [isOpen, onClose, isClient]);

  useEffect(() => {
    if (!isClient) return;

    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isClient]);

  // 只在客户端渲染，避免SSR不匹配
  if (!isClient) return null;

  const sideClasses = {
    left: 'left-0',
    right: 'right-0'
  };

  const translateClasses = {
    left: isOpen ? 'translate-x-0' : '-translate-x-full',
    right: isOpen ? 'translate-x-0' : 'translate-x-full'
  };

  return createPortal(
    <>
      {/* 背景遮罩 */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* 抽屉内容 */}
      <div
        ref={drawerRef}
        className={`fixed top-0 ${sideClasses[side]} h-full w-80 max-w-[85vw] 
                   gradient-pink-soft border-r border-pink-200 z-50 
                   transform transition-transform duration-300 ease-out
                   ${translateClasses[side]} ${className} safe-area-top safe-area-bottom`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-full overflow-y-auto">
          {children}
        </div>
      </div>
    </>,
    document.body
  );
}