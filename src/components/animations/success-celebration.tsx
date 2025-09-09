'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsClient, useWindowSize } from '@/hooks/useIsClient';

interface SuccessCelebrationProps {
  trigger: boolean;
  duration?: number;
  onComplete?: () => void;
}

/**
 * 成功庆祝动画组件
 * 当生成完成时显示爱心飘落和彩带效果
 */
export function SuccessCelebration({ 
  trigger, 
  duration = 3000,
  onComplete 
}: SuccessCelebrationProps) {
  const [isActive, setIsActive] = useState(false);
  const isClient = useIsClient();
  const { height: windowHeight } = useWindowSize();

  useEffect(() => {
    if (trigger) {
      setIsActive(true);
      const timer = setTimeout(() => {
        setIsActive(false);
        onComplete?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [trigger, duration, onComplete]);

  // 生成随机位置和延迟
  const generateParticles = (count: number, emoji: string) => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      emoji,
      x: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 3,
      scale: 0.8 + Math.random() * 0.4
    }));
  };

  const hearts = generateParticles(8, '💕');
  const sparkles = generateParticles(6, '✨');
  const confetti = generateParticles(10, '🎉');

  // 只在客户端渲染动画，避免SSR不匹配
  if (!isClient) return null;

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="fixed inset-0 pointer-events-none z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* 爱心飘落 */}
          {hearts.map((heart) => (
            <motion.div
              key={`heart-${heart.id}`}
              className="absolute text-2xl"
              style={{ left: `${heart.x}%`, top: '-10%' }}
              initial={{ 
                y: 0,
                opacity: 0,
                scale: 0,
                rotate: 0
              }}
              animate={{ 
                y: windowHeight + 100,
                opacity: [0, 1, 1, 0],
                scale: [0, heart.scale, heart.scale, 0],
                rotate: [0, 360, 720]
              }}
              transition={{
                duration: heart.duration,
                delay: heart.delay,
                ease: "easeOut"
              }}
            >
              {heart.emoji}
            </motion.div>
          ))}

          {/* 星光闪烁 */}
          {sparkles.map((sparkle) => (
            <motion.div
              key={`sparkle-${sparkle.id}`}
              className="absolute text-xl"
              style={{ 
                left: `${sparkle.x}%`, 
                top: `${20 + Math.random() * 60}%` 
              }}
              initial={{ 
                scale: 0,
                opacity: 0,
                rotate: 0
              }}
              animate={{ 
                scale: [0, sparkle.scale * 1.5, sparkle.scale, 0],
                opacity: [0, 1, 0.8, 0],
                rotate: [0, 180, 360]
              }}
              transition={{
                duration: sparkle.duration,
                delay: sparkle.delay,
                repeat: 2,
                repeatType: "reverse"
              }}
            >
              {sparkle.emoji}
            </motion.div>
          ))}

          {/* 彩带飘舞 */}
          {confetti.map((conf) => (
            <motion.div
              key={`confetti-${conf.id}`}
              className="absolute text-lg"
              style={{ left: `${conf.x}%`, top: '-5%' }}
              initial={{ 
                y: 0,
                x: 0,
                opacity: 0,
                scale: 0,
                rotate: 0
              }}
              animate={{ 
                y: windowHeight + 50,
                x: [-20, 20, -10, 10, 0],
                opacity: [0, 1, 1, 0],
                scale: [0, conf.scale, conf.scale * 0.8, 0],
                rotate: [0, 360, 720, 1080]
              }}
              transition={{
                duration: conf.duration,
                delay: conf.delay,
                ease: "easeOut"
              }}
            >
              {conf.emoji}
            </motion.div>
          ))}

          {/* 中央庆祝文字 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="text-center"
              initial={{ scale: 0, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0, opacity: 0, y: -50 }}
              transition={{ 
                duration: 0.6,
                type: "spring",
                stiffness: 200,
                damping: 15
              }}
            >
              <motion.div
                className="text-6xl mb-2"
                animate={{ 
                  rotate: [0, -5, 5, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 0.8,
                  repeat: 2,
                  repeatType: "reverse"
                }}
              >
                🎉
              </motion.div>
              <motion.h2
                className="text-2xl font-bold gradient-pink-glow bg-clip-text text-transparent"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                生成成功！
              </motion.h2>
              <motion.p
                className="text-pink-600 mt-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
              >
                小仙女的专属试穿效果来啦～ ✨
              </motion.p>
            </motion.div>
          </div>

          {/* 背景光晕效果 */}
          <motion.div
            className="absolute inset-0 bg-gradient-radial from-pink-200/30 via-transparent to-transparent"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 2, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 1 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}