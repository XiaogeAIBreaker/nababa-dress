'use client';

import { useEffect, useState } from 'react';

/**
 * 检测是否在客户端环境的Hook
 * 用于解决SSR/CSR不匹配的问题
 */
export function useIsClient() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}

/**
 * 安全获取窗口尺寸的Hook
 * 在服务端返回默认值，客户端返回真实值
 */
export function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: 375, // 默认移动端宽度
    height: 667 // 默认移动端高度
  });

  const isClient = useIsClient();

  useEffect(() => {
    if (!isClient) return;

    const updateSize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    // 立即更新一次
    updateSize();

    // 监听窗口大小变化
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [isClient]);

  return windowSize;
}