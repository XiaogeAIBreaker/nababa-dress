'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button"
import { CatAssistant } from '@/components/ai/cat-assistant';
import { useUserData } from '@/hooks/useUserData';
import type { UserLevel } from '@/types';

export default function About() {
  const { data: session, status } = useSession();
  const { user } = useUserData();
  const userLevel = (user?.userLevel || 'free') as UserLevel;

  return (
    <div className="min-h-screen bg-transparent">
      {/* Hero Section */}
      <div className="px-4 py-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* 小猫头像 */}
          <motion.div 
            className="flex justify-center mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ 
              delay: 0.2, 
              duration: 0.5, 
              type: "spring",
              stiffness: 200 
            }}
          >
            <CatAssistant 
              size="lg" 
              userLevel={userLevel}
              expression="excited"
              className="cat-shadow-soft"
            />
          </motion.div>

          {/* 主标题 */}
          <motion.h1 
            className="text-4xl font-bold mb-4 gradient-pink-glow bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            小猫更衣
          </motion.h1>
          
          <motion.p 
            className="text-lg text-gray-600 mb-8 leading-relaxed px-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            AI虚拟试穿专家<br />
            让你在家就能试遍全世界的美衣 ✨
          </motion.p>
          
          {/* CTA按钮 - 更新链接到新首页 */}
          {status === 'loading' ? (
            <div className="space-y-4">
              <div className="h-12 bg-pink-100 animate-pulse rounded-2xl mx-8"></div>
              <div className="h-10 bg-pink-50 animate-pulse rounded-2xl mx-12"></div>
            </div>
          ) : session?.user ? (
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <Link href="/">
                <Button className="cat-gradient-button w-full max-w-xs touch-target text-lg font-semibold">
                  🎨 立即开始AI试穿
                </Button>
              </Link>
              <div className="flex space-x-3 justify-center">
                <Link href="/dashboard">
                  <Button variant="outline" size="sm" className="border-pink-300 text-pink-600 hover:bg-pink-50 touch-target">
                    📊 控制台
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button variant="outline" size="sm" className="border-pink-300 text-pink-600 hover:bg-pink-50 touch-target">
                    👤 个人中心
                  </Button>
                </Link>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <Link href="/">
                <Button className="cat-gradient-button w-full max-w-xs touch-target text-lg font-semibold">
                  💕 立即免费体验
                </Button>
              </Link>
              <Link href="/auth/signin">
                <Button variant="outline" className="border-pink-300 text-pink-600 hover:bg-pink-50 touch-target">
                  已有账号？立即登录
                </Button>
              </Link>
            </motion.div>
          )}
        </motion.div>
      </div>
      
      {/* Features Section */}
      <div className="px-4 pb-8">
        <motion.h2 
          className="text-2xl font-bold text-center mb-6 text-gray-800"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          ✨ 为什么选择小猫更衣
        </motion.h2>
        
        <div className="space-y-4 max-w-md mx-auto">
          {[
            {
              emoji: '🤖',
              title: 'AI智能识别',
              description: '精准识别人体轮廓和服装特征',
              delay: 1.2
            },
            {
              emoji: '👗',
              title: '真实试穿效果',
              description: '考虑光影、褶皱，呈现最真实效果',
              delay: 1.4
            },
            {
              emoji: '⚡',
              title: '极速生成',
              description: '30-60秒快速生成，支持批量处理',
              delay: 1.6
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              className="cat-card p-4 text-center hover:shadow-xl transition-shadow duration-200"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: feature.delay, duration: 0.4 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="text-3xl mb-2">{feature.emoji}</div>
              <h3 className="font-semibold text-gray-800 mb-1">{feature.title}</h3>
              <p className="text-sm cat-text-muted">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* VIP简介 - 移动端优化 */}
      {!session?.user && (
        <div className="px-4 pb-8">
          <motion.div 
            className="cat-card p-6 text-center max-w-sm mx-auto"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.8, duration: 0.5 }}
          >
            <h3 className="text-xl font-bold mb-3 gradient-pink-glow bg-clip-text text-transparent">
              💎 VIP特权
            </h3>
            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <p>🆓 <strong>Free:</strong> 每周签到 • 1件服装</p>
              <p>➕ <strong>Plus:</strong> 每日签到 • 3件服装</p>
              <p>👑 <strong>Pro:</strong> 批量生成 • 10件服装</p>
            </div>
            <p className="text-xs cat-text-muted">
              注册即送6积分，立即体验AI试穿魔法！
            </p>
          </motion.div>
        </div>
      )}

      {/* 使用步骤 - 移动端横向滑动 */}
      <div className="px-4 pb-8">
        <motion.h2 
          className="text-2xl font-bold text-center mb-6 text-gray-800"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2, duration: 0.5 }}
        >
          📝 简单三步，轻松试穿
        </motion.h2>
        
        <div className="flex space-x-4 overflow-x-auto pb-4">
          {[
            { step: '1', emoji: '📸', title: '上传照片', desc: '清晰全身照' },
            { step: '2', emoji: '👗', title: '选择服装', desc: '心仪的衣服' },
            { step: '3', emoji: '✨', title: 'AI生成', desc: '30秒出效果' }
          ].map((item, index) => (
            <motion.div
              key={index}
              className="flex-shrink-0 w-32 text-center"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 2.2 + index * 0.2, duration: 0.4 }}
            >
              <div className="cat-card p-4 mb-2">
                <div className="w-8 h-8 bg-gradient-pink-warm rounded-full flex items-center justify-center text-white font-bold text-sm mb-2 mx-auto">
                  {item.step}
                </div>
                <div className="text-2xl mb-2">{item.emoji}</div>
                <h4 className="font-semibold text-sm text-gray-800 mb-1">{item.title}</h4>
                <p className="text-xs cat-text-muted">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 底部CTA */}
      {!session?.user && (
        <div className="px-4 pb-8">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.8, duration: 0.5 }}
          >
            <h2 className="text-2xl font-bold mb-3 text-gray-800">
              准备好变美了吗？ 💕
            </h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              千万用户的选择，AI试穿新体验<br />
              让购衣不再是盲盒，让美丽触手可及
            </p>
            <Link href="/">
              <Button className="cat-gradient-button w-full max-w-xs touch-target text-lg font-semibold mb-3">
                🌟 立即免费体验
              </Button>
            </Link>
            <p className="text-xs cat-text-muted">
              注册即送6积分 • 无需信用卡 • 随时可取消
            </p>
          </motion.div>
        </div>
      )}

      {/* 安全底部间距 */}
      <div className="safe-area-bottom h-4" />
    </div>
  )
}