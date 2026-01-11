'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TopNav } from '@/components/shared';
import { useAuth } from '@/contexts/AuthContext';
import { Campaign } from '@/contexts';
import {
  ProfileCard,
  ProfileUser,
  PortfolioBanner,
  CampaignSection,
  InsightSummary,
  MyPageHeader,
} from '@/components/mypage';
import { getFirebaseAuth } from '@/lib/firebase/auth';

// ============================================
// Influencer MyPage
// 광고주 시선에서 신뢰·판단·설득이 가능한 인플루언서 마이페이지
// ============================================

export default function InfluencerMyPage() {
  const router = useRouter();
  const { user: authUser, isLoading: authLoading, isLoggedIn } = useAuth();

  const [appliedCampaigns, setAppliedCampaigns] = useState<Campaign[]>([]);
  const [completedCampaigns, setCompletedCampaigns] = useState<Campaign[]>([]);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);
  const [portfolioItems, setPortfolioItems] = useState<Array<{
    id: string;
    imageUrl: string;
    contentUrl?: string;
    title?: string;
  }>>([]);

  // 인증 및 권한 확인
  useEffect(() => {
    if (!authLoading) {
      if (!isLoggedIn) {
        router.push('/auth/login');
      } else if (authUser?.role !== 'influencer') {
        router.push('/main');
      }
    }
  }, [authLoading, isLoggedIn, authUser, router]);

  // 인플루언서 캠페인 데이터 로드
  useEffect(() => {
    const loadCampaigns = async () => {
      if (!authUser?.uid) return;

      setIsLoadingCampaigns(true);
      try {
        const auth = getFirebaseAuth();
        const firebaseUser = auth.currentUser;
        if (!firebaseUser) return;

        const token = await firebaseUser.getIdToken();

        // 지원한 캠페인 목록 가져오기
        // TODO: 실제 API 엔드포인트로 교체 필요
        // const response = await fetch(`/api/influencers/${authUser.uid}/campaigns`, {
        //   headers: { 'Authorization': `Bearer ${token}` },
        // });
        // const data = await response.json();
        // if (data.success) {
        //   setAppliedCampaigns(data.data.inProgress || []);
        //   setCompletedCampaigns(data.data.completed || []);
        // }

        // 포트폴리오 데이터 로드
        // TODO: 실제 API 엔드포인트로 교체 필요
        // const portfolioResponse = await fetch(`/api/influencers/${authUser.uid}/portfolio`, {
        //   headers: { 'Authorization': `Bearer ${token}` },
        // });
        // const portfolioData = await portfolioResponse.json();
        // if (portfolioData.success) {
        //   setPortfolioItems(portfolioData.data.items || []);
        // }
      } catch (error) {
        console.error('Load campaigns error:', error);
      } finally {
        setIsLoadingCampaigns(false);
      }
    };

    if (authUser?.uid) {
      loadCampaigns();
    }
  }, [authUser?.uid]);

  // ProfileUser 형태로 변환
  const profileUser: ProfileUser | null = authUser ? {
    uid: authUser.uid,
    displayName: authUser.displayName,
    email: authUser.email,
    photoURL: authUser.photoURL,
    bio: authUser.bio,
    nickname: authUser.nickname,
    followerCount: authUser.followerCount,
    // TODO: 실제 플랫폼 데이터 연동 필요
    platforms: ['Instagram', 'YouTube'], // 임시 데이터
  } : null;

  // 프로필 수정 핸들러
  const handleEditProfile = () => {
    router.push('/influencer/profile/edit');
  };

  // 로딩 중
  if (authLoading || !profileUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />

      <main className="pt-16 pb-24">
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
          {/* 상단 제목/액션 영역 */}
          <MyPageHeader onEditClick={handleEditProfile} />

          {/* 1. 상단 프로필 카드 */}
          <ProfileCard
            user={profileUser}
            role="influencer"
          />

          {/* 2. 포트폴리오 배너 영역 */}
          <PortfolioBanner portfolioItems={portfolioItems} />

          {/* 3. 진행 중인 캠페인 */}
          <CampaignSection
            title="진행 중인 캠페인"
            campaigns={appliedCampaigns}
            emptyMessage="현재 진행 중인 캠페인이 없습니다"
          />

          {/* 4. 완료된 캠페인 */}
          <CampaignSection
            title="완료된 캠페인"
            campaigns={completedCampaigns}
            emptyMessage="완료된 캠페인이 없습니다"
          />

          {/* 5. 성과 인사이트 섹션 (하단 CTA) */}
          <InsightSummary
            // TODO: 실제 성과 데이터 연동 필요
            // averageViews={averageViews}
            // averageEngagementRate={averageEngagementRate}
            // recentCampaignPerformance={recentCampaignPerformance}
          />
        </div>
      </main>
    </div>
  );
}
