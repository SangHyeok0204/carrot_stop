'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { TopNav } from '@/components/shared/TopNav';
import {
  ImageGallery,
  CampaignSummary,
  AdvertiserCard,
  CampaignDescription,
  InfluencerRequirements,
  ProcessGuide,
  FixedCTA,
  CampaignReviews,
} from '@/components/campaigns';

// ============================================
// Campaign Delete Button Component
// ============================================

function CampaignDeleteButton({
  campaignId,
  campaignTitle,
  status,
  onDelete,
}: {
  campaignId: string;
  campaignTitle: string;
  status: string;
  onDelete: () => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`정말 "${campaignTitle}" 캠페인을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 모든 관련 데이터(지원, 제출물, 리뷰 등)가 영구적으로 삭제됩니다.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) return;

      const token = await user.getIdToken();
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        alert('캠페인이 삭제되었습니다.');
        onDelete();
      } else {
        alert(data.error?.message || '캠페인 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Delete campaign error:', error);
      alert('캠페인 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="
        w-full px-4 py-2
        bg-red-600 text-white text-sm font-medium rounded-lg
        hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed
        transition-colors
        flex items-center justify-center gap-2
      "
    >
      {isDeleting ? (
        <>
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          삭제 중...
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          캠페인 삭제
        </>
      )}
    </button>
  );
}

// ============================================
// Types
// ============================================

interface CampaignDetail {
  id: string;
  title: string;
  status: string;
  advertiserId: string;
  advertiserName?: string;
  category?: string;
  objective?: string;
  channel?: string;
  budget?: string;
  description?: string;
  naturalLanguageInput?: string;
  imageUrl?: string;
  images?: string[];
  deadline?: string;
  createdAt?: string;
  applicationsCount?: number;
  selectedInfluencerIds?: string[];
  spec?: {
    objective?: string;
    target_audience?: {
      demographics?: string;
      interests?: string[];
    };
    tone_and_mood?: string[];
    recommended_content_types?: Array<{
      platform: string;
      format: string;
      rationale?: string;
    }>;
    budget_range?: {
      min: number;
      max: number;
      currency: string;
    };
    schedule?: {
      estimated_duration_days: number;
      milestones?: Array<{
        phase: string;
        days_from_start: number;
      }>;
    };
    constraints?: {
      must_have?: string[];
      must_not?: string[];
    };
  };
}

interface AuthUser {
  id: string;
  role: 'advertiser' | 'influencer' | 'admin';
  displayName?: string;
}

// ============================================
// Page Component
// ============================================

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  const loadData = async () => {
    try {
      const auth = getFirebaseAuth();
      const firebaseUser = auth.currentUser;

      let token: string | null = null;
      let userData: any = null;
      
      if (firebaseUser) {
        token = await firebaseUser.getIdToken();

        // 사용자 정보 로드
        const userResponse = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        userData = await userResponse.json();
        if (userData.success) {
          setUser(userData.data);
        }
      }

      // 캠페인 정보 로드
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const campaignResponse = await fetch(`/api/campaigns/${campaignId}`, { headers });
      const campaignData = await campaignResponse.json();

      if (campaignData.success) {
        setCampaign(campaignData.data);

        // 인플루언서인 경우 이미 지원했는지 확인
        if (userData?.success && userData.data?.role === 'influencer' && campaignData.data.applications) {
          const applied = campaignData.data.applications.some(
            (app: any) => app.influencerId === userData.data.id
          );
          setHasApplied(applied);
        }
      }
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    setApplying(true);
    try {
      const auth = getFirebaseAuth();
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) return;

      const token = await firebaseUser.getIdToken();
      const response = await fetch(`/api/campaigns/${campaignId}/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ message: '' }),
      });

      const data = await response.json();
      if (data.success) {
        setHasApplied(true);
        loadData();
      } else {
        alert(data.error?.message || '지원에 실패했습니다.');
      }
    } catch (error) {
      console.error('Apply error:', error);
      alert('지원에 실패했습니다.');
    } finally {
      setApplying(false);
    }
  };

  // Loading state
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

  // Not found
  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNav />
        <div className="pt-24 max-w-4xl mx-auto px-4 text-center">
          <div className="py-20">
            <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-6 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">캠페인을 찾을 수 없습니다</h1>
            <p className="text-gray-500 mb-6">요청하신 캠페인이 존재하지 않거나 삭제되었습니다.</p>
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

  const isOwner = user?.id === campaign.advertiserId;
  const isInfluencer = user?.role === 'influencer';
  const description = campaign.naturalLanguageInput || campaign.description || '';

  // 예산 포맷팅
  const budgetDisplay = campaign.spec?.budget_range
    ? `${campaign.spec.budget_range.min.toLocaleString()}~${campaign.spec.budget_range.max.toLocaleString()}${campaign.spec.budget_range.currency}`
    : campaign.budget;

  // 타임라인 변환
  const timeline = campaign.spec?.schedule?.milestones?.map(m => ({
    phase: m.phase,
    description: `${m.days_from_start}일차`,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />

      {/* 뒤로가기 버튼 */}
      <button
        onClick={() => router.back()}
        className="fixed top-20 left-4 z-30 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
      >
        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* 상단: 이미지 갤러리 */}
      <div className="pt-16">
        <ImageGallery
          mainImage={campaign.imageUrl}
          images={campaign.images}
          title={campaign.title}
          category={campaign.category}
        />
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-6xl mx-auto px-4 py-8 pb-32 lg:pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 좌측: 메인 정보 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 이미지 바로 아래: 핵심 요약 정보 */}
            <CampaignSummary
              title={campaign.title}
              description={description.slice(0, 100) + (description.length > 100 ? '...' : '')}
              budget={budgetDisplay}
              deadline={campaign.deadline}
              channel={campaign.channel}
              status={campaign.status}
              category={campaign.category}
            />

            {/* 회사(광고주) 요약 & 신뢰 요소 */}
            <AdvertiserCard
              name={campaign.advertiserName || '회사'}
              advertiserId={campaign.advertiserId}
            />

            {/* 캠페인 상세 설명 */}
            <CampaignDescription
              description={description}
            />

            {/* 구하고자 하는 인플루언서 상 */}
            <InfluencerRequirements
              platforms={campaign.spec?.recommended_content_types?.map(t => t.platform)}
              contentStyle={campaign.spec?.tone_and_mood}
              mustHave={campaign.spec?.constraints?.must_have}
              demographics={campaign.spec?.target_audience?.demographics}
              interests={campaign.spec?.target_audience?.interests}
            />

            {/* 진행 방식 & 제출물 안내 */}
            <ProcessGuide
              contentTypes={campaign.spec?.recommended_content_types}
              estimatedDays={campaign.spec?.schedule?.estimated_duration_days}
              timeline={timeline}
              mustNot={campaign.spec?.constraints?.must_not}
            />

            {/* 리뷰 섹션 */}
            <CampaignReviews
              campaignId={campaign.id}
              userRole={user?.role}
              userId={user?.id}
              advertiserId={campaign.advertiserId}
              influencerId={campaign.selectedInfluencerIds?.[0]}
            />
          </div>

          {/* 우측: 고정 CTA (데스크탑) */}
          <FixedCTA
            campaignId={campaign.id}
            status={campaign.status}
            isOwner={isOwner}
            isInfluencer={isInfluencer}
            hasApplied={hasApplied}
            isLoggedIn={!!user}
            budget={budgetDisplay}
            estimatedDays={campaign.spec?.schedule?.estimated_duration_days}
            onApply={handleApply}
            applying={applying}
          />

          {/* 캠페인 삭제 버튼 (광고주만) */}
          {isOwner && campaign.status !== 'RUNNING' && campaign.status !== 'IN_PROGRESS' && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="text-sm font-semibold text-red-900 mb-2">위험 구역</h3>
              <p className="text-xs text-red-700 mb-3">캠페인을 삭제하면 모든 관련 데이터가 영구적으로 삭제됩니다.</p>
              <CampaignDeleteButton
                campaignId={campaign.id}
                campaignTitle={campaign.title}
                status={campaign.status}
                onDelete={() => router.push('/advertiser/dashboard')}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
