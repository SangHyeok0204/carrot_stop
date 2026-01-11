'use client';

import { Card } from '@/components/ui/card';

// ============================================
// Insight Summary Component
// 성과 인사이트 섹션 (하단 CTA)
// ============================================

interface InsightSummaryProps {
  averageViews?: number;
  averageEngagementRate?: number;
  recentCampaignPerformance?: {
    campaignTitle: string;
    views: number;
    engagementRate: number;
  }[];
}

export function InsightSummary({
  averageViews,
  averageEngagementRate,
  recentCampaignPerformance,
}: InsightSummaryProps) {
  // 데이터가 없으면 placeholder
  const hasData = averageViews !== undefined || averageEngagementRate !== undefined || 
    (recentCampaignPerformance && recentCampaignPerformance.length > 0);

  if (!hasData) {
    return (
      <Card className="p-6 bg-gray-50 border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">성과 인사이트</h3>
        <div className="py-8 text-center text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-sm">성과 데이터가 없습니다</p>
          <p className="text-xs mt-1 text-gray-400">TODO: 성과 데이터 연동 필요</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-white border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">성과 인사이트</h3>

      <div className="space-y-6">
        {/* 평균 지표 */}
        <div className="grid grid-cols-2 gap-4">
          {averageViews !== undefined && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">평균 조회수</p>
              <p className="text-2xl font-bold text-gray-900">
                {averageViews.toLocaleString()}
              </p>
            </div>
          )}

          {averageEngagementRate !== undefined && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">평균 참여율</p>
              <p className="text-2xl font-bold text-gray-900">
                {averageEngagementRate.toFixed(1)}%
              </p>
            </div>
          )}
        </div>

        {/* 최근 캠페인 성과 요약 */}
        {recentCampaignPerformance && recentCampaignPerformance.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">최근 캠페인 성과</h4>
            <div className="space-y-3">
              {recentCampaignPerformance.slice(0, 3).map((campaign, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 mb-2 truncate">
                    {campaign.campaignTitle}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <span>조회수: {campaign.views.toLocaleString()}</span>
                    <span>참여율: {campaign.engagementRate.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

