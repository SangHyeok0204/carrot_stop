'use client';

import { useState, useEffect } from 'react';
import { TopNav } from '@/components/shared';
import { useAuth } from '@/contexts/AuthContext';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { getAdminFirestore } from '@/lib/firebase/admin';

export default function AdvertiserInsightsPage() {
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
        
        // 광고주의 모든 캠페인 조회
        const campaignsResponse = await fetch(`/api/campaigns?status=COMPLETED`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const campaignsData = await campaignsResponse.json();
        
        if (campaignsData.success) {
          const completedCampaigns = campaignsData.data.campaigns || [];
          
          // 각 캠페인의 제출물 통계 계산
          let totalViews = 0;
          let totalLikes = 0;
          let totalComments = 0;
          let totalSubmissions = 0;
          
          for (const campaign of completedCampaigns) {
            const submissionsResponse = await fetch(`/api/campaigns/${campaign.id}/submissions`, {
              headers: { 'Authorization': `Bearer ${token}` },
            });
            const submissionsData = await submissionsResponse.json();
            
            if (submissionsData.success) {
              const submissions = submissionsData.data.submissions || [];
              totalSubmissions += submissions.length;
              
              submissions.forEach((sub: any) => {
                totalViews += sub.metrics?.views || 0;
                totalLikes += sub.metrics?.likes || 0;
                totalComments += sub.metrics?.comments || 0;
              });
            }
          }
          
          setInsights({
            totalCampaigns: completedCampaigns.length,
            totalSubmissions,
            totalViews,
            totalLikes,
            totalComments,
            avgViews: totalSubmissions > 0 ? totalViews / totalSubmissions : 0,
            campaigns: completedCampaigns,
          });
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

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">캠페인 성과 분석</h1>

        {/* 요약 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-2">완료된 캠페인</p>
            <p className="text-3xl font-bold text-purple-600">{insights.totalCampaigns}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-2">총 제출물</p>
            <p className="text-3xl font-bold text-purple-600">{insights.totalSubmissions}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-2">총 조회수</p>
            <p className="text-3xl font-bold text-purple-600">{insights.totalViews.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-2">평균 조회수</p>
            <p className="text-3xl font-bold text-purple-600">{Math.round(insights.avgViews).toLocaleString()}</p>
          </div>
        </div>

        {/* 캠페인 목록 */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">완료된 캠페인</h2>
          </div>
          <div className="p-6">
            {insights.campaigns.length === 0 ? (
              <p className="text-gray-600 text-center py-8">완료된 캠페인이 없습니다.</p>
            ) : (
              <div className="space-y-4">
                {insights.campaigns.map((campaign: any) => (
                  <div key={campaign.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                    <h3 className="font-semibold text-gray-900">{campaign.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(campaign.completedAt || campaign.createdAt).toLocaleDateString('ko-KR')}
                    </p>
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

