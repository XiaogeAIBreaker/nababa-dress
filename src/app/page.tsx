'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function Home() {
  const { data: session, status } = useSession();

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            小猫更衣
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            AI驱动的虚拟试穿平台，让每件服装都能展现最真实的穿着效果
          </p>
          
          {status === 'loading' ? (
            <div className="flex justify-center space-x-4">
              <div className="h-12 w-32 bg-gray-200 animate-pulse rounded"></div>
              <div className="h-12 w-32 bg-gray-200 animate-pulse rounded"></div>
            </div>
          ) : session?.user ? (
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link href="/generate">
                <Button size="lg" className="text-lg px-8 py-3">
                  立即体验 AI 试穿
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" size="lg" className="text-lg px-8 py-3">
                  进入控制台
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link href="/auth/signup">
                <Button size="lg" className="text-lg px-8 py-3">
                  免费注册体验
                </Button>
              </Link>
              <Link href="/auth/signin">
                <Button variant="outline" size="lg" className="text-lg px-8 py-3">
                  用户登录
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="text-4xl mb-4">🤖</div>
              <CardTitle>AI智能识别</CardTitle>
              <CardDescription>
                先进的AI技术精确识别人体轮廓和服装特征
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="text-4xl mb-4">👗</div>
              <CardTitle>真实试穿效果</CardTitle>
              <CardDescription>
                考虑光影、褶皱、材质，呈现最真实的穿着效果
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="text-4xl mb-4">⚡</div>
              <CardTitle>快速生成</CardTitle>
              <CardDescription>
                30-60秒快速生成，Pro用户支持批量处理
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* VIP Plans */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">选择适合您的方案</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Free Plan */}
            <Card className="border-2 border-gray-200">
              <CardHeader className="text-center">
                <Badge variant="secondary" className="mb-2">免费体验</Badge>
                <CardTitle className="text-2xl">Free</CardTitle>
                <CardDescription>适合初次体验用户</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold">¥0</div>
                  <p className="text-sm text-gray-500">注册即得6积分</p>
                </div>
                <ul className="space-y-2 text-sm">
                  <li>✅ 每周签到获得6积分</li>
                  <li>✅ 单次生成消耗2积分</li>
                  <li>✅ 最多1件服装</li>
                  <li>✅ 基础客服支持</li>
                </ul>
                {!session?.user && (
                  <Link href="/auth/signup">
                    <Button className="w-full">免费注册</Button>
                  </Link>
                )}
              </CardContent>
            </Card>

            {/* Plus Plan */}
            <Card className="border-2 border-blue-500 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge variant="info" className="px-3 py-1">推荐</Badge>
              </div>
              <CardHeader className="text-center pt-8">
                <Badge variant="info" className="mb-2">社交升级</Badge>
                <CardTitle className="text-2xl text-blue-600">Plus</CardTitle>
                <CardDescription>通过微信验证免费升级</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">¥0</div>
                  <p className="text-sm text-gray-500">微信验证升级</p>
                </div>
                <ul className="space-y-2 text-sm">
                  <li>✅ 每日签到获得6积分</li>
                  <li>✅ 单次生成消耗2积分</li>
                  <li>✅ 最多3件服装</li>
                  <li>✅ 优先客服支持</li>
                  <li>✅ 微信认证标识</li>
                </ul>
                {session?.user?.userLevel === 'free' && (
                  <Link href="/upgrade">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      免费升级Plus
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="border-2 border-purple-500 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge variant="default" className="px-3 py-1">最超值</Badge>
              </div>
              <CardHeader className="text-center pt-8">
                <Badge variant="default" className="mb-2">充值升级</Badge>
                <CardTitle className="text-2xl text-purple-600">Pro</CardTitle>
                <CardDescription>充值任意积分包自动升级</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">¥6起</div>
                  <p className="text-sm text-gray-500">含积分 + Pro特权</p>
                </div>
                <ul className="space-y-2 text-sm">
                  <li>✅ 包含所有Plus特权</li>
                  <li>✅ 最多10件服装</li>
                  <li>✅ 批量生成(20积分)</li>
                  <li>✅ 专属客服支持</li>
                  <li>✅ 优先处理速度</li>
                </ul>
                {session?.user?.userLevel !== 'pro' && (
                  <Link href="/purchase">
                    <Button className="w-full bg-purple-600 hover:bg-purple-700">
                      充值升级Pro
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* How It Works */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-8">如何使用</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl mx-auto">
                1️⃣
              </div>
              <h3 className="font-semibold">注册账户</h3>
              <p className="text-sm text-gray-600">快速注册，获得6个免费积分</p>
            </div>

            <div className="space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl mx-auto">
                2️⃣
              </div>
              <h3 className="font-semibold">上传照片</h3>
              <p className="text-sm text-gray-600">上传清晰的全身照和服装图片</p>
            </div>

            <div className="space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl mx-auto">
                3️⃣
              </div>
              <h3 className="font-semibold">AI生成</h3>
              <p className="text-sm text-gray-600">AI智能分析，30秒生成试穿效果</p>
            </div>

            <div className="space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl mx-auto">
                4️⃣
              </div>
              <h3 className="font-semibold">查看结果</h3>
              <p className="text-sm text-gray-600">获得高质量的虚拟试穿图片</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">准备开始您的AI试穿体验吗？</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            加入thousands用户，体验最先进的AI虚拟试穿技术，找到最适合您的服装搭配
          </p>
          
          {status === 'loading' ? (
            <div className="h-12 w-48 bg-gray-200 animate-pulse rounded mx-auto"></div>
          ) : session?.user ? (
            <Link href="/generate">
              <Button size="lg" className="text-lg px-12 py-4">
                立即体验 AI 试穿 →
              </Button>
            </Link>
          ) : (
            <Link href="/auth/signup">
              <Button size="lg" className="text-lg px-12 py-4">
                免费开始体验 →
              </Button>
            </Link>
          )}
        </div>
      </div>
    </main>
  )
}