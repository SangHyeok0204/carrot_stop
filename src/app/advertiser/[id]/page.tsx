'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { TopNav } from '@/components/shared';
import { getFirebaseAuth } from '@/lib/firebase/auth';

export default function AdvertiserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const advertiserId = params.id as string;

  const [advertiser, setAdvertiser] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [advertiserId]);

  const loadData = async () => {
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      const headers: Record<string, string> = {};
      
      if (user) {
        const token = await user.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      }

      // 광고주 정보 로드
      const userResponse = await fetch(`/api/users/${advertiserId}`, { headers });
      const userData = await userResponse.json();
      
      if (userData.success) {
        setAdvertiser(userData.data);
      }

      // 광고주의 캠페인 로드
      const campaignsResponse = await fetch(`/api/campaigns?advertiserId=${advertiserId}`, { headers });
      const campaignsData = await campaignsResponse.json();
      
      if (campaignsData.success) {
        setCampaigns(campaignsData.data.campaigns || []);
      }
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNav />
        <div className="pt-24 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" />
        </div>
      </div>
    );
  }

  if (!advertiser) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNav />
        <div className="pt-24 max-w-4xl mx-auto px-4 text-center">
          <div className="py-20">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">광고주를 찾을 수 없습니다</h1>
            <p className="text-gray-500 mb-6">요청하신 광고주가 존재하지 않거나 삭제되었습니다.</p>
            <Link
              href="/main"
              className="inline-block px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
              메인으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />

      <div className="pt-16 max-w-6xl mx-auto px-4 py-8">
        {/* 프로필 헤더 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start gap-6">
            {advertiser.profile?.photoURL && (
              <img
                src={advertiser.profile.photoURL}
                alt={advertiser.displayName}
                className="w-24 h-24 rounded-full object-cover"
              />
            )}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {advertiser.displayName || '광고주'}
              </h1>
              {advertiser.profile?.companyName && (
                <p className="text-lg text-gray-600 mb-2">{advertiser.profile.companyName}</p>
              )}
              {advertiser.profile?.bio && (
                <p className="text-gray-700">{advertiser.profile.bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* 캠페인 목록 */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">캠페인 ({campaigns.length})</h2>
          {campaigns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaigns.map((campaign) => (
                <Link
                  key={campaign.id}
                  href={`/campaigns/${campaign.id}`}
                  className="bg-white rounded-lg border border-gray-200 p-4 hover:border-purple-300 hover:shadow-md transition-all"
                >
                  <h3 className="font-semibold text-gray-900 mb-2">{campaign.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2">{campaign.description}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
                      {campaign.status}
                    </span>
                    {campaign.category && (
                      <span className="text-xs text-gray-500">{campaign.category}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
              등록된 캠페인이 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
