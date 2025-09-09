'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { CatSpeechSystem } from '@/components/ai/cat-assistant';

interface GenerationProgressProps {
  isGenerating: boolean;
  progress: number;
  onComplete?: () => void;
  className?: string;
}

/**
 * AI生成进度组件
 * 显示生成过程中的进度和动态消息
 */
export function GenerationProgress({ 
  isGenerating, 
  progress, 
  onComplete,
  className = '' 
}: GenerationProgressProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [displayProgress, setDisplayProgress] = useState(0);

  const messages = CatSpeechSystem.getGeneratingMessages();

  useEffect(() => {
    if (!isGenerating) {
      setCurrentMessageIndex(0);
      setDisplayProgress(0);
      return;
    }

    // 平滑进度更新
    const progressTimer = setInterval(() => {
      setDisplayProgress(prev => {
        const diff = progress - prev;
        if (diff > 0) {
          return prev + Math.min(diff * 0.1, 2);
        }
        return prev;
      });
    }, 100);

    // 消息轮播
    const messageTimer = setInterval(() => {
      setCurrentMessageIndex(prev => (prev + 1) % messages.length);
    }, 2000);

    return () => {
      clearInterval(progressTimer);
      clearInterval(messageTimer);
    };
  }, [isGenerating, progress, messages.length]);

  useEffect(() => {
    if (progress >= 100 && displayProgress >= 99) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [progress, displayProgress, onComplete]);

  if (!isGenerating) return null;

  return (
    <motion.div 
      className={`cat-card p-6 mx-4 mb-6 text-center ${className}`}
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -20 }}
      transition={{ 
        duration: 0.4,
        ease: "easeOut"
      }}
    >
      {/* 生成动画 */}
      <div className="mb-4">
        <motion.div 
          className="text-4xl mb-2"
          animate={{ 
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          ✨
        </motion.div>
        
        <div className="flex justify-center space-x-1 mb-4">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="w-3 h-3 bg-pink-400 rounded-full"
              animate={{
                y: [-2, -8, -2],
                opacity: [0.4, 1, 0.4],
                scale: [0.8, 1.2, 0.8]
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      </div>

      {/* 进度条 */}
      <motion.div 
        className="mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <Progress 
          value={displayProgress} 
          className="h-3 bg-pink-100" 
        />
        <motion.p 
          className="text-sm cat-text-muted mt-2"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {Math.round(displayProgress)}%
        </motion.p>
      </motion.div>

      {/* 动态消息 */}
      <div className="min-h-[40px] flex items-center justify-center">
        <motion.p 
          className="text-pink-600 font-medium"
          key={currentMessageIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {messages[currentMessageIndex]}
        </motion.p>
      </div>

      {/* 温馨提示 */}
      <motion.div 
        className="mt-4 pt-4 border-t border-pink-200"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.4 }}
      >
        <p className="text-sm cat-text-muted">
          请耐心等待，小猫正在为你精心制作专属试穿效果～ 💕
        </p>
      </motion.div>
    </motion.div>
  );
}