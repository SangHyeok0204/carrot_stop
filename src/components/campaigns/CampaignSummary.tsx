'use client';

import { Badge } from '@/components/ui/badge';

// ============================================
// Campaign Summary Component
// 핵심 요약 정보 - "지원 여부를 바로 판단하는 영역"
// 반드시 이 순서: 제목 → 한 줄 설명 → 보상/예산 → 일정 → 채널 → 상태
// ============================================

interface CampaignSummaryProps {
  title: string;
  description?: string;
  budget?: string;
  deadline?: string;
  channel?: string;
  status: string;
  category?: string;
}

// 상태 설정
const statusConfig: Record<string, { label: string; className: string }> = {
  'OPEN': { label: '모집중', className: 'bg-green-500 text-white' },
  'IN_PROGRESS': { label: '진행중', className: 'bg-blue-500 text-white' },
  'RUNNING': { label: '진행중', className: 'bg-blue-500 text-white' },
  'MATCHING': { label: '매칭중', className: 'bg-blue-500 text-white' },
  'COMPLETED': { label: '완료', className: 'bg-gray-400 text-white' },
  'CANCELLED': { label: '취소됨', className: 'bg-red-400 text-white' },
};

// 채널 아이콘
const ChannelIcon = ({ channel }: { channel: string }) => {
  const channelLower = channel?.toLowerCase() || '';

  if (channelLower.includes('instagram')) {
    return (
      <svg className="w-5 h-5 text-pink-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    );
  }

  if (channelLower.includes('youtube')) {
    return (
      <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    );
  }

  if (channelLower.includes('tiktok')) {
    return (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
      </svg>
    );
  }

  return (
    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
};

export function CampaignSummary({
  title,
  description,
  budget,
  deadline,
  channel,
  status,
  category,
}: CampaignSummaryProps) {
  const statusStyle = statusConfig[status] || statusConfig['OPEN'];

  // 마감일 포맷팅
  const formatDeadline = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return '마감됨';
    if (diffDays === 0) return '오늘 마감';
    if (diffDays <= 7) return `D-${diffDays}`;
    return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="space-y-4">
      {/* 1. 캠페인 제목 */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge className={statusStyle.className}>{statusStyle.label}</Badge>
          {category && (
            <Badge variant="outline" className="text-gray-600">{category}</Badge>
          )}
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          {title}
        </h1>
      </div>

      {/* 2. 한 줄 설명 */}
      {description && (
        <p className="text-gray-600 text-lg">
          {description}
        </p>
      )}

      {/* 3-6. 핵심 정보 그리드 (보상/예산 → 일정 → 채널 → 상태) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
        {/* 보상/예산 */}
        {budget && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500">보상</p>
              <p className="font-semibold text-gray-900 truncate">{budget}</p>
            </div>
          </div>
        )}

        {/* 일정(마감일 또는 기간) */}
        {deadline && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500">마감</p>
              <p className="font-semibold text-gray-900 truncate">{formatDeadline(deadline)}</p>
            </div>
          </div>
        )}

        {/* 진행 채널 */}
        {channel && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
              <ChannelIcon channel={channel} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500">채널</p>
              <p className="font-semibold text-gray-900 truncate">{channel}</p>
            </div>
          </div>
        )}

        {/* 캠페인 상태 */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500">상태</p>
            <p className="font-semibold text-gray-900 truncate">{statusStyle.label}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
