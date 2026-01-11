'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TopNav } from '@/components/shared';
import { useAuth } from '@/contexts/AuthContext';
import { Campaign } from '@/contexts';
import {
  ProfileCard,
  ProfileUser,
  BrandBanner,
  CampaignSection,
  InsightsCTA,
  MyPageHeader,
} from '@/components/mypage';

// ============================================
// Floating Action Button (인플루언서 전용 - 캠페인 찾기)
// ============================================

function FloatingActionButton() {
  return (
    <Link
      href="/influencer/feed"
      className="
        fixed bottom-6 right-6 z-40
        w-14 h-14 rounded-full
        bg-pink-500 text-white
        flex items-center justify-center
        shadow-lg hover:bg-pink-600
        active:scale-95 transition-all duration-200
      "
      aria-label="캠페인 찾기"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </Link>
  );
}

// ============================================
// MyPage
// ============================================

export default function InfluencerMyPage() {
  const router = useRouter();
  const { user: authUser, isLoading: authLoading, isLoggedIn } = useAuth();

  // TODO: 인플루언서 지원 캠페인 데이터 fetch API 연동 필요
  const [appliedCampaigns, setAppliedCampaigns] = useState<Campaign[]>([]);
  const [completedCampaigns, setCompletedCampaigns] = useState<Campaign[]>([]);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);

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

  // TODO: 인플루언서 지원 캠페인 데이터 fetch
  useEffect(() => {
    if (authUser?.uid) {
      // fetchInfluencerCampaigns();
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
  } : null;

  // 프로필 수정 핸들러
  const handleEditProfile = () => {
    // TODO: 프로필 편집 페이지/모달로 이동
    router.push('/influencer/profile/edit');
  };

  // 로딩 중
  if (authLoading || !profileUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />

      <main className="pt-16 pb-24">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          {/* 상단 제목/액션 영역 */}
          <MyPageHeader onEditClick={handleEditProfile} />

          {/* 프로필 카드 */}
          <ProfileCard
            user={profileUser}
            role="influencer"
            followerCount={profileUser.followerCount}
          />

          {/* 포트폴리오 배너 */}
          <BrandBanner placeholderText="포트폴리오 배너" />

          {/* 진행 중인 캠페인 (지원 중 / 선정됨) */}
          <CampaignSection
            title="진행 중인 캠페인"
            campaigns={appliedCampaigns}
            emptyMessage="현재 진행 중인 캠페인이 없습니다"
          />

          {/* 완료된 캠페인 */}
          <CampaignSection
            title="완료된 캠페인"
            campaigns={completedCampaigns}
            emptyMessage="완료된 캠페인이 없습니다"
          />

          {/* 성과 인사이트 CTA */}
          <InsightsCTA role="influencer" />
        </div>
      </main>

      {/* 플로팅 액션 버튼 */}
      <FloatingActionButton />
    </div>
  );
}
