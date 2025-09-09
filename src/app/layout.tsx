import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/providers/session-provider'
import { ToastProvider } from '@/components/ui/toast'
import { Header } from '@/components/header'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '小猫更衣 - AI虚拟试穿',
  description: '利用AI技术实现一键虚拟试穿，让每件服装都能展现最真实的穿着效果',
  keywords: '虚拟试穿,AI试衣,服装搭配,在线试穿,智能试衣',
  authors: [{ name: '小猫更衣团队' }],
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover'
  },
  themeColor: '#FF69B4',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '小猫更衣'
  },
  formatDetection: {
    telephone: false
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.className} cat-gradient-bg min-h-screen`}>
        <AuthProvider>
          <ToastProvider>
            <div className="min-h-screen flex flex-col">
              <Header />
              <main className="flex-1">
                {children}
              </main>
            </div>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}