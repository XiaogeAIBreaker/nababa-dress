'use client';

import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { CatAssistant } from '@/components/ai/cat-assistant';
import type { UserLevel } from '@/types';

export interface ChatMessageProps {
  type: 'ai' | 'user' | 'system';
  content?: string;
  images?: string[];
  userLevel?: UserLevel;
  timestamp?: Date;
  isTyping?: boolean;
  children?: ReactNode;
  className?: string;
}

/**
 * 聊天消息组件
 * 支持AI消息、用户消息和系统消息
 */
export function ChatMessage({
  type,
  content,
  images = [],
  userLevel = 'free',
  timestamp,
  isTyping = false,
  children,
  className = ''
}: ChatMessageProps) {
  if (type === 'ai') {
    return (
      <motion.div 
        className={`flex items-start space-x-3 mb-6 ${className}`}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ 
          duration: 0.4,
          ease: "easeOut",
          type: "spring",
          stiffness: 100
        }}
      >
        {/* AI头像 */}
        <motion.div 
          className="flex-shrink-0"
          initial={{ scale: 0.8, rotate: -5 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <CatAssistant 
            size="md" 
            userLevel={userLevel}
            expression={isTyping ? 'thinking' : 'happy'}
            className="cat-shadow-soft"
          />
        </motion.div>

        {/* AI消息内容 */}
        <div className="flex-1 max-w-[80%]">
          <motion.div 
            className="cat-card p-4 relative"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            {/* 对话气泡箭头 */}
            <div className="absolute -left-2 top-4 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[8px] border-r-white/90"></div>
            
            {isTyping ? (
              <motion.div 
                className="flex items-center space-x-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex space-x-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 bg-pink-400 rounded-full"
                      animate={{
                        y: [0, -4, 0],
                        opacity: [0.6, 1, 0.6]
                      }}
                      transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        delay: i * 0.1
                      }}
                    />
                  ))}
                </div>
                <span className="text-sm cat-text-muted">小猫正在思考中...</span>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                {content && (
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {content}
                  </p>
                )}
                {children}
              </motion.div>
            )}
          </motion.div>
          
          {timestamp && !isTyping && (
            <motion.p 
              className="text-xs cat-text-muted mt-1 ml-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.3 }}
            >
              {timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
            </motion.p>
          )}
        </div>
      </motion.div>
    );
  }

  if (type === 'user') {
    return (
      <motion.div 
        className={`flex items-start justify-end space-x-3 mb-6 ${className}`}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ 
          duration: 0.3,
          ease: "easeOut"
        }}
      >
        {/* 用户消息内容 */}
        <div className="flex-1 max-w-[80%] text-right">
          <div className="inline-block">
            {/* 图片展示 */}
            {images.length > 0 && (
              <motion.div 
                className="mb-2"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                {images.length === 1 ? (
                  <div className="inline-block cat-card p-2 relative">
                    <div className="absolute -right-2 top-4 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[8px] border-l-white/90"></div>
                    <Image
                      src={images[0]}
                      alt="用户上传的图片"
                      width={200}
                      height={200}
                      className="rounded-xl max-w-[200px] max-h-[200px] object-cover"
                      unoptimized={images[0].startsWith('data:')}
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-w-[300px] cat-card p-2 relative">
                    <div className="absolute -right-2 top-4 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[8px] border-l-white/90"></div>
                    {images.slice(0, 4).map((image, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 + index * 0.1, duration: 0.3 }}
                      >
                        <Image
                          src={image}
                          alt={`用户上传的图片 ${index + 1}`}
                          width={120}
                          height={120}
                          className="rounded-lg object-cover"
                          unoptimized={image.startsWith('data:')}
                        />
                      </motion.div>
                    ))}
                    {images.length > 4 && (
                      <motion.div 
                        className="rounded-lg bg-pink-100 flex items-center justify-center text-pink-600 font-medium"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6, duration: 0.3 }}
                      >
                        +{images.length - 4}
                      </motion.div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* 文字内容 */}
            {content && (
              <motion.div 
                className="gradient-pink-warm text-white p-3 rounded-2xl relative cat-shadow-soft"
                initial={{ opacity: 0, scale: 0.95, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: images.length > 0 ? 0.4 : 0.1, duration: 0.3 }}
              >
                <div className="absolute -right-2 top-4 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[8px] border-l-pink-400"></div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {content}
                </p>
              </motion.div>
            )}

            {children}
          </div>

          {timestamp && (
            <motion.p 
              className="text-xs cat-text-muted mt-1 mr-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.3 }}
            >
              {timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
            </motion.p>
          )}
        </div>

        {/* 用户头像 */}
        <motion.div 
          className="flex-shrink-0"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, duration: 0.2 }}
        >
          <div className="w-10 h-10 gradient-pink-warm rounded-full flex items-center justify-center text-white font-semibold">
            👤
          </div>
        </motion.div>
      </motion.div>
    );
  }

  if (type === 'system') {
    return (
      <div className={`flex justify-center mb-4 ${className}`}>
        <div className="bg-pink-100/60 text-pink-600 px-4 py-2 rounded-full text-sm">
          {content}
          {children}
        </div>
      </div>
    );
  }

  return null;
}