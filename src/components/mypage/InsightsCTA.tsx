'use client';

import Link from 'next/link';
import { UserRole } from '@/contexts/AuthContext';

// ============================================
// Insights CTA Component
// ============================================

interface InsightsCTAProps {
  role: UserRole;
}

export function InsightsCTA({ role }: InsightsCTAProps) {
  // 역할에 따른 인사이트 페이지 경로
  const href = role === 'advertiser'
    ? '/advertiser/insights'
    : '/influencer/insights';

  return (
    <Link
      href={href}  // TODO: 인사이트 페이지 구현 필요
      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <span className="font-medium text-gray-900">성과 인사이트</span>
      </div>
      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}
