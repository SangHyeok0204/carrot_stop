'use client';

import { useState, useEffect } from 'react';
import { TopNav } from '@/components/shared';
import { useAuth } from '@/contexts/AuthContext';
import { getFirebaseAuth } from '@/lib/firebase/auth';

export default function InfluencerInsightsPage() {
  const { authUser } = useAuth();
  const [insights, setInsights] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadInsights = async () => {
      if (!authUser?.uid) return;

      setIsLoading(true);
      try {
        const auth = getFirebaseAuth();
        const firebaseUser = auth.currentUser;
        if (!firebaseUser) return;

        const token = await firebaseUser.getIdToken();
        const response = await fetch(`/api/influencers/${authUser.uid}/insights`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await response.json();
        if (data.success) {
          setInsights(data.data);
        }
      } catch (error) {
        console.error('Load insights error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInsights();
  }, [authUser?.uid]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNav />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">데이터를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNav />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-20">
            <p className="text-gray-600">성과 데이터가 없습니다.</p>
          </div>
        </div>
      </div>
    );
  }

  const { summary, recentCampaigns } = insights;

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">성과 인사이트</h1>

        {/* 요약 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-2">평균 조회수</p>
            <p className="text-3xl font-bold text-purple-600">{summary.avgViews.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-2">평균 참여율</p>
            <p className="text-3xl font-bold text-purple-600">{summary.avgEngagementRate}%</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-2">총 제출물</p>
            <p className="text-3xl font-bold text-purple-600">{summary.totalSubmissions}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-2">총 조회수</p>
            <p className="text-3xl font-bold text-purple-600">{summary.totalViews.toLocaleString()}</p>
          </div>
        </div>

        {/* 최근 캠페인 성과 */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">최근 캠페인 성과</h2>
          </div>
          <div className="p-6">
            {recentCampaigns.length === 0 ? (
              <p className="text-gray-600 text-center py-8">최근 캠페인 성과가 없습니다.</p>
            ) : (
              <div className="space-y-4">
                {recentCampaigns.map((campaign: any, idx: number) => (
                  <div key={idx} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{campaign.campaignTitle}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {new Date(campaign.submittedAt).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm text-gray-600">조회수</p>
                          <p className="text-lg font-semibold text-gray-900">{campaign.views.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">참여율</p>
                          <p className="text-lg font-semibold text-gray-900">{campaign.engagementRate}%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

