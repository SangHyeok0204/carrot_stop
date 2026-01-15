'use client';

import { useEffect, useState, useRef } from 'react';
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
import { Button } from '@/components/ui/button';

// ============================================
// Influencer MyPage (kmong 스타일)
// 광고주 시선에서 신뢰·판단·설득이 가능한 인플루언서 마이페이지
// ============================================

type TabType = 'info' | 'portfolio' | 'campaigns' | 'reviews';

export default function InfluencerMyPage() {
  const router = useRouter();
  const { user: authUser, isLoading: authLoading, isLoggedIn } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [appliedCampaigns, setAppliedCampaigns] = useState<Campaign[]>([]);
  const [completedCampaigns, setCompletedCampaigns] = useState<Campaign[]>([]);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);
  const [applicationIds, setApplicationIds] = useState<Record<string, string>>({}); // campaignId -> applicationId 매핑
  const [portfolioItems, setPortfolioItems] = useState<Array<{
    id: string;
    imageUrl: string;
    contentUrl?: string;
    title?: string;
  }>>([]);
  const [insights, setInsights] = useState<{
    averageViews?: number;
    averageEngagementRate?: number;
    recentCampaignPerformance?: Array<{
      campaignTitle: string;
      views: number;
      engagementRate: number;
    }>;
  } | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  // 섹션 refs
  const infoRef = useRef<HTMLDivElement>(null);
  const portfolioRef = useRef<HTMLDivElement>(null);
  const campaignsRef = useRef<HTMLDivElement>(null);
  const reviewsRef = useRef<HTMLDivElement>(null);

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

  // 스크롤 시 탭 자동 변경
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200; // 약간의 오프셋

      const sections = [
        { ref: infoRef, tab: 'info' as TabType },
        { ref: portfolioRef, tab: 'portfolio' as TabType },
        { ref: campaignsRef, tab: 'campaigns' as TabType },
        { ref: reviewsRef, tab: 'reviews' as TabType },
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
        const campaignsResponse = await fetch(`/api/influencers/${authUser.uid}/campaigns`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const campaignsData = await campaignsResponse.json();
        if (campaignsData.success) {
          setAppliedCampaigns(campaignsData.data.grouped.applied || []);
          setCompletedCampaigns(campaignsData.data.grouped.completed || []);
          
          // applicationId 매핑 저장
          const appIds: Record<string, string> = {};
          (campaignsData.data.applications || []).forEach((app: any) => {
            if (app.campaignId && app.id) {
              appIds[app.campaignId] = app.id;
            }
          });
          setApplicationIds(appIds);
        }

        // 포트폴리오 데이터 가져오기
        const portfolioResponse = await fetch(`/api/influencers/${authUser.uid}/portfolio`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const portfolioData = await portfolioResponse.json();
        if (portfolioData.success) {
          setPortfolioItems(portfolioData.data.portfolios || []);
        }

        // 성과 데이터 가져오기
        const insightsResponse = await fetch(`/api/influencers/${authUser.uid}/insights`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const insightsData = await insightsResponse.json();
        if (insightsData.success) {
          setInsights({
            averageViews: insightsData.data.summary.avgViews,
            averageEngagementRate: insightsData.data.summary.avgEngagementRate,
            recentCampaignPerformance: insightsData.data.recentCampaigns.map((campaign: any) => ({
              campaignTitle: campaign.campaignTitle,
              views: campaign.views,
              engagementRate: campaign.engagementRate,
            })),
          });
        }

        // 사용자 프로필 데이터 가져오기
        const profileResponse = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const profileData = await profileResponse.json();
        if (profileData.success && profileData.data) {
          setUserProfile(profileData.data);
        }
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
    platforms: authUser.profile?.platforms || undefined, // 실제 플랫폼 정보 사용
  } : null;

  // 탭 클릭 핸들러
  const handleTabClick = (tab: TabType) => {
    setActiveTab(tab);
    const refs = {
      info: infoRef,
      portfolio: portfolioRef,
      campaigns: campaignsRef,
      reviews: reviewsRef,
    };
    refs[tab].current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
                      alt={profileUser.nickname || profileUser.displayName || ''}
                      className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-purple-100 flex items-center justify-center border-2 border-gray-200">
                      <span className="text-3xl font-bold text-purple-600">
                        {(profileUser.nickname || profileUser.displayName || 'I').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  {/* 온라인 상태 표시 (초록색 점) */}
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                </div>

                {/* 이름 */}
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">
                    {profileUser.nickname || profileUser.displayName || '사용자'}
                  </h1>

                  {/* 탭 메뉴 */}
                  <div className="flex items-center gap-6 border-b border-gray-200">
                    {[
                      { id: 'info', label: '전문가 정보' },
                      { id: 'portfolio', label: '포트폴리오' },
                      { id: 'campaigns', label: '캠페인' },
                      { id: 'reviews', label: '받은 리뷰' },
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
              <div className="ml-6 flex gap-3">
                <Button
                  onClick={() => router.push('/influencer/profile/edit')}
                  variant="outline"
                  className="px-6 py-3"
                >
                  프로필 편집
                </Button>
                <Button className="bg-gray-900 text-white hover:bg-gray-800 px-6 py-3">
                  문의하기
                </Button>
              </div>
            </div>
          </div>

          {/* 전문가 정보 섹션 */}
          <div ref={infoRef} className="mb-16">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 좌측: 전문가 정보 */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">전문가 정보</h2>
                  <Button
                    onClick={() => router.push('/influencer/profile/edit')}
                    variant="outline"
                    size="sm"
                  >
                    수정
                  </Button>
                </div>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {profileUser.bio || '전문가 소개가 없습니다.'}
                </p>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">경력사항</h3>
                  <p className="text-gray-700">
                    {userProfile?.profile?.careerYears !== undefined && userProfile?.profile?.careerMonths !== undefined
                      ? `프리랜서 ${userProfile.profile.careerYears}년 ${userProfile.profile.careerMonths}개월`
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
                        <p className="text-sm text-gray-500 mb-1">총 작업 수</p>
                        <p className="text-xl font-bold text-gray-900">
                          {appliedCampaigns.length + completedCampaigns.length}개
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">진행 중</p>
                        <p className="text-xl font-bold text-gray-900">{appliedCampaigns.length}개</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">완료</p>
                        <p className="text-xl font-bold text-gray-900">{completedCampaigns.length}개</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">전문가 정보</h3>
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
                      <div>
                        <p className="text-gray-500 mb-1">지역</p>
                        <p className="text-gray-900">
                          {userProfile?.profile?.location || '지역 정보가 없습니다.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 포트폴리오 섹션 */}
          <div ref={portfolioRef} className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">포트폴리오</h2>
              <select className="px-4 py-2 border border-gray-300 rounded-lg text-sm">
                <option>디자인</option>
                <option>전체</option>
              </select>
            </div>
            <PortfolioBanner portfolioItems={portfolioItems} />
          </div>

          {/* 성과 인사이트 섹션 */}
          <div className="mb-16">
            <InsightSummary
              averageViews={insights?.averageViews}
              averageEngagementRate={insights?.averageEngagementRate}
              recentCampaignPerformance={insights?.recentCampaignPerformance}
            />
          </div>

          {/* 캠페인 섹션 */}
          <div ref={campaignsRef} className="mb-16">
            <CampaignSection
              title="진행 중인 캠페인"
              campaigns={appliedCampaigns}
              emptyMessage="현재 진행 중인 캠페인이 없습니다"
              applicationIds={applicationIds}
              onCancelApplication={async () => {
                // 지원 취소 후 목록 새로고침
                const auth = getFirebaseAuth();
                const firebaseUser = auth.currentUser;
                if (!firebaseUser) return;

                const token = await firebaseUser.getIdToken();
                const campaignsResponse = await fetch(`/api/influencers/${authUser?.uid}/campaigns`, {
                  headers: { 'Authorization': `Bearer ${token}` },
                });
                const campaignsData = await campaignsResponse.json();
                if (campaignsData.success) {
                  setAppliedCampaigns(campaignsData.data.grouped.applied || []);
                  setCompletedCampaigns(campaignsData.data.grouped.completed || []);
                  
                  const appIds: Record<string, string> = {};
                  (campaignsData.data.applications || []).forEach((app: any) => {
                    if (app.campaignId && app.id) {
                      appIds[app.campaignId] = app.id;
                    }
                  });
                  setApplicationIds(appIds);
                }
              }}
            />
            <div className="mt-8">
              <CampaignSection
                title="완료된 캠페인"
                campaigns={completedCampaigns}
                emptyMessage="완료된 캠페인이 없습니다"
                applicationIds={applicationIds}
              />
            </div>
          </div>

          {/* 리뷰 섹션 */}
          <div ref={reviewsRef} className="mb-16">
            <h2 className="text-xl font-bold text-gray-900 mb-6">받은 리뷰</h2>
            <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
              <p>아직 받은 리뷰가 없습니다.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
