'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { TopNav } from '@/components/shared';
import { getFirebaseAuth } from '@/lib/firebase/auth';

export default function InfluencerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const influencerId = params.id as string;

  const [influencer, setInfluencer] = useState<any>(null);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [influencerId]);

  const loadData = async () => {
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      const headers: Record<string, string> = {};
      
      if (user) {
        const token = await user.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      }

      // 인플루언서 정보 로드
      const userResponse = await fetch(`/api/users/${influencerId}`, { headers });
      const userData = await userResponse.json();
      
      if (userData.success) {
        setInfluencer(userData.data);
      }

      // 포트폴리오 로드
      const portfolioResponse = await fetch(`/api/influencers/${influencerId}/portfolio`, { headers });
      const portfolioData = await portfolioResponse.json();
      
      if (portfolioData.success) {
        setPortfolio(portfolioData.data.portfolios || []);
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

  if (!influencer) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNav />
        <div className="pt-24 max-w-4xl mx-auto px-4 text-center">
          <div className="py-20">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">인플루언서를 찾을 수 없습니다</h1>
            <p className="text-gray-500 mb-6">요청하신 인플루언서가 존재하지 않거나 삭제되었습니다.</p>
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
            {influencer.profile?.photoURL && (
              <img
                src={influencer.profile.photoURL}
                alt={influencer.displayName || influencer.profile?.nickname}
                className="w-24 h-24 rounded-full object-cover"
              />
            )}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {influencer.profile?.nickname || influencer.displayName || '인플루언서'}
              </h1>
              {influencer.profile?.bio && (
                <p className="text-gray-700 mb-4">{influencer.profile.bio}</p>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                {influencer.profile?.platforms && influencer.profile.platforms.length > 0 && (
                  <div>
                    <span className="font-medium">활동 플랫폼: </span>
                    {influencer.profile.platforms.join(', ')}
                  </div>
                )}
                {influencer.followerCount && (
                  <div>
                    <span className="font-medium">팔로워: </span>
                    {influencer.followerCount.toLocaleString()}명
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 포트폴리오 */}
        {portfolio.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">포트폴리오</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {portfolio.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-all"
                >
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.title || '포트폴리오'}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  {item.title && (
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900">{item.title}</h3>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
