'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TopNav, CampaignCard } from '@/components/shared';
import { useCampaigns, Campaign, CampaignStatus } from '@/contexts';
import { useAuth } from '@/contexts/AuthContext';
import { UserProfile } from '@/types/user';

// ============================================
// Types
// ============================================

interface AdvertiserUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  profile?: UserProfile;
}

// ============================================
// Profile Header Component (Instagram Style)
// ============================================

interface ProfileHeaderProps {
  user: AdvertiserUser;
  stats: {
    totalCampaigns: number;
    totalApplications: number;
  };
  isFollowing: boolean;
  onFollowToggle: () => void;
}

function ProfileHeader({ user, stats, isFollowing, onFollowToggle }: ProfileHeaderProps) {
  const profile = user.profile;
  const displayName = profile?.companyName || user.displayName || '광고주';
  const handle = profile?.handle || user.email?.split('@')[0] || 'user';

  // Mock follower/following counts (실제 구현 시 API에서 가져옴)
  const followerCount = 128;
  const followingCount = 45;

  return (
    <div className="bg-white border-b border-purple-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
          {/* 프로필 이미지 - 인스타그램 스타일 그라디언트 링 */}
          <div className="relative flex-shrink-0">
            {/* 그라디언트 링 */}
            <div className="w-36 h-36 md:w-44 md:h-44 rounded-full p-[3px] bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600">
              <div className="w-full h-full rounded-full p-[3px] bg-white">
                <div className="w-full h-full rounded-full overflow-hidden">
                  {profile?.photoURL ? (
                    <img
                      src={profile.photoURL}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-400 to-violet-500 flex items-center justify-center">
                      <span className="text-4xl md:text-5xl font-bold text-white">
                        {displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* 인증 뱃지 */}
            <div className="absolute bottom-3 right-3 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center ring-3 ring-white shadow-lg">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          {/* 프로필 정보 */}
          <div className="flex-1 text-center md:text-left">
            {/* 이름 & 버튼 영역 */}
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <h1 className="text-xl font-normal text-gray-900">{handle}</h1>
                {/* 인증 마크 */}
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>

              <div className="flex items-center justify-center md:justify-start gap-2">
                {/* 팔로우 버튼 */}
                <button
                  onClick={onFollowToggle}
                  className={`
                    px-5 py-1.5 rounded-lg font-semibold text-sm
                    transition-all duration-200
                    ${isFollowing
                      ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                    }
                  `}
                >
                  {isFollowing ? '팔로잉' : '팔로우'}
                </button>

                {/* 메시지 버튼 */}
                <button className="px-5 py-1.5 rounded-lg bg-gray-100 text-gray-900 font-semibold text-sm hover:bg-gray-200 transition-colors">
                  메시지
                </button>

                {/* 더보기 버튼 */}
                <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  <svg className="w-5 h-5 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 통계 - 인스타그램 스타일 */}
            <div className="flex items-center justify-center md:justify-start gap-10 mb-4">
              <div>
                <span className="font-semibold text-gray-900">{stats.totalCampaigns}</span>
                <span className="text-gray-900 ml-1">캠페인</span>
              </div>
              <div>
                <span className="font-semibold text-gray-900">{followerCount}</span>
                <span className="text-gray-900 ml-1">팔로워</span>
              </div>
              <div>
                <span className="font-semibold text-gray-900">{followingCount}</span>
                <span className="text-gray-900 ml-1">팔로잉</span>
              </div>
            </div>

            {/* 표시 이름 (굵게) */}
            <p className="font-semibold text-gray-900 mb-1">{displayName}</p>

            {/* @핸들 배지 */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-sm mb-2">
              <div className="w-4 h-4 rounded-full bg-gray-300 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-gray-500" />
              </div>
              @{handle}
            </div>

            {/* Bio */}
            {profile?.bio && (
              <p className="text-gray-900 mb-2 max-w-md">{profile.bio}</p>
            )}

            {/* 위치 */}
            {profile?.location && (
              <p className="text-gray-500 text-sm mb-2">{profile.location}</p>
            )}

            {/* 웹사이트 링크 */}
            {profile?.websiteUrl && (
              <a
                href={profile.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-900 font-semibold text-sm hover:underline mb-3"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                {profile.websiteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}
              </a>
            )}

            {/* SNS 버튼 */}
            <div className="flex items-center justify-center md:justify-start gap-2 mt-3">
              {profile?.instagramUrl && (
                <a
                  href={profile.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white text-xs font-medium hover:opacity-90 transition-opacity"
                >
                  <div className="w-3.5 h-3.5 rounded bg-white/30" />
                  Instagram
                </a>
              )}
              {profile?.youtubeUrl && (
                <a
                  href={profile.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors"
                >
                  <div className="w-3.5 h-3.5 rounded bg-white/30" />
                  YouTube
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Horizontal Campaign Slider
// ============================================

interface CampaignSliderProps {
  title: string;
  campaigns: Campaign[];
  emptyMessage: string;
}

function CampaignSlider({ title, campaigns, emptyMessage }: CampaignSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className="py-6">
      <div className="flex items-center justify-between mb-4 px-4">
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        {campaigns.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={() => scroll('left')}
              className="w-8 h-8 rounded-full bg-white border border-purple-100 flex items-center justify-center hover:bg-purple-50 hover:border-purple-200 transition-colors"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-8 h-8 rounded-full bg-white border border-purple-100 flex items-center justify-center hover:bg-purple-50 hover:border-purple-200 transition-colors"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {campaigns.length === 0 ? (
        <div className="mx-4 py-12 bg-white rounded-2xl border border-purple-100 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
            <div className="w-6 h-6 rounded bg-purple-300" />
          </div>
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide px-4 pb-2"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="flex-shrink-0 w-72"
              style={{ scrollSnapAlign: 'start' }}
            >
              <CampaignCard
                campaign={campaign}
                variant="default"
                showStatus={true}
                showAdvertiser={false}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ============================================
// Campaign Grid
// ============================================



// ============================================
// Floating Action Button
// ============================================

function FloatingActionButton() {
  return (
    <Link
      href="/advertiser/campaigns/new"
      className="
        fixed bottom-6 right-6 z-40
        w-14 h-14 rounded-full
        bg-gradient-to-r from-purple-600 to-violet-600
        text-white text-2xl font-light
        flex items-center justify-center
        shadow-lg shadow-purple-300
        hover:from-purple-700 hover:to-violet-700
        hover:scale-110
        active:scale-95
        transition-all duration-200
      "
      aria-label="새 캠페인 만들기"
    >
      +
    </Link>
  );
}

// ============================================
// Dashboard Page
// ============================================

export default function AdvertiserDashboardPage() {
  const router = useRouter();
  const { campaigns, fetchMyCampaigns, isLoading } = useCampaigns();
  const { user: authUser, isLoading: authLoading, isLoggedIn } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);

  // 인증 및 권한 확인
  useEffect(() => {
    if (!authLoading) {
      if (!isLoggedIn) {
        router.push('/auth/login');
      } else if (authUser?.role !== 'advertiser') {
        router.push('/main');
      }
    }
  }, [authLoading, isLoggedIn, authUser, router]);

  // AdvertiserUser 형태로 변환
  const user: AdvertiserUser | null = authUser ? {
    uid: authUser.uid,
    displayName: authUser.displayName,
    email: authUser.email,
    profile: {
      companyName: authUser.companyName,
      photoURL: authUser.photoURL,
    },
  } : null;

  // 캠페인 데이터 fetch
  useEffect(() => {
    if (user) {
      fetchMyCampaigns();
    }
  }, [user, fetchMyCampaigns]);

  // 팔로우 토글
  const handleFollowToggle = () => {
    setIsFollowing(!isFollowing);
  };

  // 내 캠페인
  const myCampaigns = campaigns;

  // 진행 중인 캠페인 (OPEN 또는 IN_PROGRESS)
  const activeCampaigns = myCampaigns.filter(
    (c) => c.status === 'OPEN' || c.status === 'IN_PROGRESS'
  );

  // 통계
  const totalApplications = myCampaigns.reduce((sum, c) => sum + c.applicationsCount, 0);

  // 로딩 중
  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-purple-50">
      <TopNav />

      {/* 프로필 헤더 */}
      <div className="pt-16">
        <ProfileHeader
          user={user}
          stats={{
            totalCampaigns: myCampaigns.length,
            totalApplications,
          }}
          isFollowing={isFollowing}
          onFollowToggle={handleFollowToggle}
        />
      </div>

      {/* 진행 중인 캠페인 슬라이더 */}
      <div className="max-w-7xl mx-auto">
        <CampaignSlider
          title="진행 중인 캠페인"
          campaigns={activeCampaigns}
          emptyMessage="현재 진행 중인 캠페인이 없습니다"
        />
      </div>


      {/* 플로팅 액션 버튼 */}
      <FloatingActionButton />

      {/* 스크롤바 숨김 스타일 */}
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
