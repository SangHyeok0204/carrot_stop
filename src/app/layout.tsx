import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AppProviders } from '@/contexts'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI 관리형 광고 운영 시스템',
  description: '자연어로 광고 캠페인을 만들고 관리하세요',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  )
}
