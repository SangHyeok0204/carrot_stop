'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TopNav } from '@/components/shared';
import { useCampaigns } from '@/contexts';
import { useAuth } from '@/contexts/AuthContext';
import {
  ProfileCard,
  ProfileUser,
  BrandBanner,
  CampaignSection,
  InsightsCTA,
  MyPageHeader,
} from '@/components/mypage';
import { Button } from '@/components/ui/button';
import { getFirebaseAuth } from '@/lib/firebase/auth';

// ============================================
// Floating Action Button (광고주 전용)
// ============================================

function FloatingActionButton() {
  return (
    <Link
      href="/advertiser/campaigns/new"
      className="
        fixed bottom-6 right-6 z-40
        w-14 h-14 rounded-full
        bg-purple-600 text-white text-2xl font-light
        flex items-center justify-center
        shadow-lg hover:bg-purple-700
        active:scale-95 transition-all duration-200
      "
      aria-label="새 캠페인 만들기"
    >
      +
    </Link>
  );
}

// ============================================
// Dashboard Page (kmong 스타일)
// ============================================

type TabType = 'info' | 'campaigns' | 'insights';

export default function AdvertiserDashboardPage() {
  const router = useRouter();
  const { campaigns, fetchMyCampaigns } = useCampaigns();
  const { user: authUser, isLoading: authLoading, isLoggedIn } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('info');

  // 섹션 refs
  const infoRef = useRef<HTMLDivElement>(null);
  const campaignsRef = useRef<HTMLDivElement>(null);
  const insightsRef = useRef<HTMLDivElement>(null);

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

  // 스크롤 시 탭 자동 변경
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;

      const sections = [
        { ref: infoRef, tab: 'info' as TabType },
        { ref: campaignsRef, tab: 'campaigns' as TabType },
        { ref: insightsRef, tab: 'insights' as TabType },
      ];

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section.ref.current) {
          const offsetTop = section.ref.current.offsetTop;
          if (scrollPosition >= offsetTop) {
            setActiveTab(section.tab);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 사용자 프로필 데이터 상태
  const [userProfile, setUserProfile] = useState<any>(null);

  // 사용자 프로필 데이터 가져오기
  useEffect(() => {
    if (authUser) {
      const fetchProfile = async () => {
        try {
          const auth = getFirebaseAuth();
          const user = auth.currentUser;
          if (!user) return;

          const token = await user.getIdToken();
          const response = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          const data = await response.json();
          if (data.success && data.data) {
            setUserProfile(data.data);
          }
        } catch (error) {
          console.error('Failed to fetch profile:', error);
        }
      };
      fetchProfile();
    }
  }, [authUser]);

  // ProfileUser 형태로 변환
  const profileUser: ProfileUser | null = authUser ? {
    uid: authUser.uid,
    displayName: authUser.displayName,
    email: authUser.email,
    photoURL: authUser.photoURL,
    bio: authUser.bio,
    companyName: authUser.companyName,
  } : null;

  // 캠페인 데이터 fetch
  useEffect(() => {
    if (profileUser) {
      fetchMyCampaigns();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileUser?.uid]);

  // 탭 클릭 핸들러
  const handleTabClick = (tab: TabType) => {
    setActiveTab(tab);
    const refs = {
      info: infoRef,
      campaigns: campaignsRef,
      insights: insightsRef,
    };
    refs[tab].current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // 캠페인 분류
  const myCampaigns = campaigns;
  const activeCampaigns = myCampaigns.filter(
    (c) => c.status === 'OPEN' || c.status === 'IN_PROGRESS'
  );
  const completedCampaigns = myCampaigns.filter(
    (c) => c.status === 'COMPLETED'
  );

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
    <div className="min-h-screen bg-white">
      <TopNav />

      <main className="pt-16">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* 상단 프로필 카드 (kmong 스타일) */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-5 flex-1">
                {/* 프로필 이미지 */}
                <div className="relative">
                  {profileUser.photoURL ? (
                    <img
                      src={profileUser.photoURL}
                      alt={profileUser.companyName || profileUser.displayName || ''}
                      className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-purple-100 flex items-center justify-center border-2 border-gray-200">
                      <span className="text-3xl font-bold text-purple-600">
                        {(profileUser.companyName || profileUser.displayName || 'A').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                </div>

                {/* 이름 */}
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">
                    {profileUser.companyName || profileUser.displayName || '회사'}
                  </h1>

                  {/* 탭 메뉴 */}
                  <div className="flex items-center gap-6 border-b border-gray-200">
                    {[
                      { id: 'info', label: '회사 정보' },
                      { id: 'campaigns', label: '캠페인' },
                      { id: 'insights', label: '성과 분석' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => handleTabClick(tab.id as TabType)}
                        className={`
                          pb-3 px-1 text-sm font-medium transition-colors
                          ${activeTab === tab.id
                            ? 'text-gray-900 border-b-2 border-gray-900'
                            : 'text-gray-500 hover:text-gray-700'
                          }
                        `}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 문의하기 버튼 */}
              <div className="ml-6">
                <Button className="bg-gray-900 text-white hover:bg-gray-800 px-6 py-3">
                  문의하기
                </Button>
              </div>
            </div>
          </div>

          {/* 회사 정보 섹션 */}
          <div ref={infoRef} className="mb-16">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 좌측: 회사 정보 */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">회사 정보</h2>
                  <Link href="/advertiser/profile/edit">
                    <Button variant="outline" size="sm">수정</Button>
                  </Link>
                </div>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {userProfile?.profile?.bio || '회사 소개가 없습니다.'}
                </p>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">경력사항</h3>
                  <p className="text-gray-700">
                    {userProfile?.profile?.careerYears !== undefined && userProfile?.profile?.careerMonths !== undefined
                      ? `광고주 ${userProfile.profile.careerYears}년 ${userProfile.profile.careerMonths}개월`
                      : '경력 정보가 없습니다.'}
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">총 경력</h3>
                  <p className="text-gray-700">
                    {userProfile?.profile?.totalCareerYears !== undefined
                      ? `${userProfile.profile.totalCareerYears}년`
                      : '경력 정보가 없습니다.'}
                  </p>
                </div>
              </div>

              {/* 우측: 활동 정보 */}
              <div className="lg:col-span-1">
                <div className="bg-gray-50 rounded-lg p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">활동 정보</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">총 캠페인 수</p>
                        <p className="text-xl font-bold text-gray-900">{myCampaigns.length}개</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">진행 중</p>
                        <p className="text-xl font-bold text-gray-900">{activeCampaigns.length}개</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">완료</p>
                        <p className="text-xl font-bold text-gray-900">{completedCampaigns.length}개</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">회사 정보</h3>
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="text-gray-500 mb-1">회원구분</p>
                        <p className="text-gray-900">기업회원</p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">연락 가능 시간</p>
                        <p className="text-gray-900">
                          {userProfile?.profile?.availableHours || '연락 가능 시간이 설정되지 않았습니다.'}
                        </p>
                      </div>
                      {profileUser.email && (
                        <div>
                          <p className="text-gray-500 mb-1">이메일</p>
                          <p className="text-gray-900">{profileUser.email}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 캠페인 섹션 */}
          <div ref={campaignsRef} className="mb-16">
            <CampaignSection
              title="진행 중인 캠페인"
              campaigns={activeCampaigns}
              emptyMessage="현재 진행 중인 캠페인이 없습니다"
              showDeleteButton={true}
              onDelete={fetchMyCampaigns}
            />
            <div className="mt-8">
              <CampaignSection
                title="완료된 캠페인"
                campaigns={completedCampaigns}
                emptyMessage="완료된 캠페인이 없습니다"
                showDeleteButton={true}
                onDelete={fetchMyCampaigns}
              />
            </div>
          </div>

          {/* 성과 분석 섹션 */}
          <div ref={insightsRef} className="mb-16">
            <h2 className="text-xl font-bold text-gray-900 mb-6">성과 분석</h2>
            <InsightsCTA role="advertiser" />
          </div>
        </div>
      </main>

      {/* 플로팅 액션 버튼 */}
      <FloatingActionButton />
    </div>
  );
}
