'use client';

import { ReactNode, useRef, useEffect } from 'react';

interface ChatContainerProps {
  children: ReactNode;
  className?: string;
}

/**
 * 聊天容器组件
 * 自动滚动到底部，适合消息流展示
 */
export function ChatContainer({ children, className = '' }: ChatContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [children]);

  return (
    <div 
      ref={containerRef}
      className={`flex-1 overflow-y-auto px-4 py-6 space-y-4 ${className}`}
      style={{ 
        maxHeight: 'calc(100vh - 120px)', // 预留header和输入区域空间
        scrollBehavior: 'smooth'
      }}
    >
      {children}
    </div>
  );
}