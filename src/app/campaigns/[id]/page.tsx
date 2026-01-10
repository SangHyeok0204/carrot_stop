'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { TopNav } from '@/components/shared/TopNav';

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
  deadline?: string;
  createdAt?: string;
  applicationsCount?: number;
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
    }>;
    budget_range?: {
      min: number;
      max: number;
      currency: string;
    };
    schedule?: {
      estimated_duration_days: number;
    };
    constraints?: {
      must_have?: string[];
      must_not?: string[];
    };
  };
  applications?: Array<{
    id: string;
    status: string;
    influencer?: {
      displayName?: string;
      email?: string;
    };
    message?: string;
  }>;
}

interface AuthUser {
  id: string;
  role: 'advertiser' | 'influencer' | 'admin';
  displayName?: string;
}

// ============================================
// Status Config
// ============================================

const statusConfig: Record<string, { label: string; className: string }> = {
  'OPEN': { label: '모집중', className: 'bg-green-500 text-white' },
  'IN_PROGRESS': { label: '진행중', className: 'bg-purple-500 text-white' },
  'MATCHING': { label: '매칭중', className: 'bg-blue-500 text-white' },
  'RUNNING': { label: '진행중', className: 'bg-purple-500 text-white' },
  'COMPLETED': { label: '완료', className: 'bg-slate-400 text-white' },
  'CANCELLED': { label: '취소됨', className: 'bg-red-400 text-white' },
  'DRAFT': { label: '초안', className: 'bg-gray-400 text-white' },
  'GENERATED': { label: '생성됨', className: 'bg-yellow-500 text-white' },
  'REVIEWED': { label: '검토됨', className: 'bg-blue-400 text-white' },
  'APPROVED': { label: '승인됨', className: 'bg-green-400 text-white' },
};

// 카테고리별 색상
const categoryColors: Record<string, { bg: string; gradient: string }> = {
  '카페': { bg: 'bg-amber-100', gradient: 'from-amber-400 to-orange-300' },
  '음식점': { bg: 'bg-orange-100', gradient: 'from-orange-400 to-red-300' },
  '바/주점': { bg: 'bg-purple-100', gradient: 'from-purple-400 to-violet-300' },
  '뷰티/미용': { bg: 'bg-pink-100', gradient: 'from-pink-400 to-rose-300' },
  '패션/의류': { bg: 'bg-rose-100', gradient: 'from-rose-400 to-pink-300' },
  '스포츠/피트니스': { bg: 'bg-green-100', gradient: 'from-green-400 to-emerald-300' },
  '페스티벌/행사': { bg: 'bg-violet-100', gradient: 'from-violet-400 to-purple-300' },
  '서포터즈': { bg: 'bg-blue-100', gradient: 'from-blue-400 to-cyan-300' },
  '리뷰/체험단': { bg: 'bg-teal-100', gradient: 'from-teal-400 to-cyan-300' },
  '기타': { bg: 'bg-slate-100', gradient: 'from-slate-400 to-gray-300' },
};

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
  }, [campaignId]);

  const loadData = async () => {
    try {
      const auth = getFirebaseAuth();
      const firebaseUser = auth.currentUser;

      let token: string | null = null;
      if (firebaseUser) {
        token = await firebaseUser.getIdToken();

        // 사용자 정보 로드
        const userResponse = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const userData = await userResponse.json();
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
        if (user?.role === 'influencer' && campaignData.data.applications) {
          const applied = campaignData.data.applications.some(
            (app: any) => app.influencerId === user.id
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
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
              <div className="w-8 h-8 bg-gray-400 rounded-lg" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">캠페인을 찾을 수 없습니다</h1>
            <p className="text-gray-500 mb-6">요청하신 캠페인이 존재하지 않거나 삭제되었습니다.</p>
            <Link
              href="/main"
              className="inline-block px-6 py-3 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-colors"
            >
              메인으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const status = statusConfig[campaign.status] || statusConfig['DRAFT'];
  const categoryColor = categoryColors[campaign.category || '기타'] || categoryColors['기타'];
  const isOwner = user?.id === campaign.advertiserId;
  const isInfluencer = user?.role === 'influencer';
  const canApply = isInfluencer && campaign.status === 'OPEN' && !hasApplied && !isOwner;

  const description = campaign.naturalLanguageInput || campaign.description || '';

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />

      {/* 헤더 이미지 영역 */}
      <div className="pt-16">
        <div className="h-64 md:h-80 relative overflow-hidden">
          {campaign.imageUrl ? (
            <>
              <img
                src={campaign.imageUrl}
                alt={campaign.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            </>
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${categoryColor.gradient}`}>
              <div className="absolute inset-0 flex items-center justify-center opacity-20">
                <div className="w-40 h-40 bg-white/30 rounded-full" />
                <div className="absolute w-24 h-24 bg-white/20 rounded-lg rotate-45" />
              </div>
            </div>
          )}

          {/* 뒤로가기 */}
          <button
            onClick={() => router.back()}
            className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-6xl mx-auto px-4 -mt-20 relative z-10 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 좌측: 메인 정보 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 기본 정보 카드 */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              {/* 상태 & 카테고리 배지 */}
              <div className="flex items-center gap-2 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.className}`}>
                  {status.label}
                </span>
                {campaign.category && (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${categoryColor.bg} text-gray-700`}>
                    {campaign.category}
                  </span>
                )}
              </div>

              {/* 제목 */}
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                {campaign.title}
              </h1>

              {/* 광고주 정보 */}
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-purple-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{campaign.advertiserName || '광고주'}</p>
                  <p className="text-sm text-gray-500">광고주</p>
                </div>
              </div>

              {/* 핵심 정보 그리드 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
                {campaign.budget && (
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">예산</p>
                    <p className="font-semibold text-gray-900">{campaign.budget}</p>
                  </div>
                )}
                {campaign.channel && (
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">채널</p>
                    <p className="font-semibold text-gray-900">{campaign.channel}</p>
                  </div>
                )}
                {campaign.deadline && (
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">마감일</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(campaign.deadline).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                )}
                {campaign.applicationsCount !== undefined && (
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">지원자</p>
                    <p className="font-semibold text-purple-600">{campaign.applicationsCount}명</p>
                  </div>
                )}
              </div>
            </div>

            {/* 캠페인 소개 */}
            {description && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="w-2 h-2 bg-purple-500 rounded-sm" />
                  </span>
                  캠페인 소개
                </h2>
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{description}</p>
                </div>
              </div>
            )}

            {/* 타겟 오디언스 */}
            {campaign.spec?.target_audience && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full" />
                  </span>
                  타겟 오디언스
                </h2>
                {campaign.spec.target_audience.demographics && (
                  <p className="text-gray-600 mb-3">{campaign.spec.target_audience.demographics}</p>
                )}
                {campaign.spec.target_audience.interests && campaign.spec.target_audience.interests.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {campaign.spec.target_audience.interests.map((interest, idx) => (
                      <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                        {interest}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 콘텐츠 요구사항 */}
            {campaign.spec?.recommended_content_types && campaign.spec.recommended_content_types.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-violet-100 rounded-lg flex items-center justify-center">
                    <span className="w-2 h-2 bg-violet-500 rounded-sm rotate-45" />
                  </span>
                  콘텐츠 요구사항
                </h2>
                <div className="space-y-3">
                  {campaign.spec.recommended_content_types.map((type, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                        <div className="w-4 h-4 bg-violet-400 rounded" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{type.platform}</p>
                        <p className="text-sm text-gray-500">{type.format}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 주의사항 */}
            {campaign.spec?.constraints && (campaign.spec.constraints.must_have?.length || campaign.spec.constraints.must_not?.length) && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-amber-100 rounded-lg flex items-center justify-center">
                    <span className="w-2 h-2 bg-amber-500 rounded-full" />
                  </span>
                  주의사항
                </h2>
                <div className="space-y-4">
                  {campaign.spec.constraints.must_have && campaign.spec.constraints.must_have.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-green-700 mb-2">필수 포함 사항</p>
                      <ul className="space-y-2">
                        {campaign.spec.constraints.must_have.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-gray-600">
                            <span className="w-5 h-5 bg-green-100 rounded flex items-center justify-center mt-0.5 shrink-0">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                            </span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {campaign.spec.constraints.must_not && campaign.spec.constraints.must_not.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-red-700 mb-2">금지 사항</p>
                      <ul className="space-y-2">
                        {campaign.spec.constraints.must_not.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-gray-600">
                            <span className="w-5 h-5 bg-red-100 rounded flex items-center justify-center mt-0.5 shrink-0">
                              <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                            </span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 광고주 전용: 지원자 목록 */}
            {isOwner && campaign.applications && campaign.applications.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="w-2 h-2 bg-purple-500 rounded-full" />
                  </span>
                  지원자 목록 ({campaign.applications.length}명)
                </h2>
                <div className="space-y-3">
                  {campaign.applications.map((app) => (
                    <div key={app.id} className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <div className="w-4 h-4 bg-purple-400 rounded-full" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{app.influencer?.displayName || '인플루언서'}</p>
                            <p className="text-sm text-gray-500">{app.influencer?.email}</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          app.status === 'APPLIED' ? 'bg-yellow-100 text-yellow-700' :
                          app.status === 'SELECTED' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {app.status === 'APPLIED' ? '검토중' : app.status === 'SELECTED' ? '선정됨' : app.status}
                        </span>
                      </div>
                      {app.message && (
                        <p className="mt-2 text-sm text-gray-600 pl-13">{app.message}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 우측: 신청 CTA 영역 (Sticky) */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                {/* 예산 정보 */}
                {campaign.spec?.budget_range && (
                  <div className="mb-6">
                    <p className="text-sm text-gray-500 mb-1">예상 예산</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {campaign.spec.budget_range.min.toLocaleString()} ~ {campaign.spec.budget_range.max.toLocaleString()}
                      <span className="text-base font-normal text-gray-500 ml-1">{campaign.spec.budget_range.currency}</span>
                    </p>
                  </div>
                )}

                {/* 기간 정보 */}
                {campaign.spec?.schedule && (
                  <div className="mb-6 pb-6 border-b border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">예상 기간</p>
                    <p className="text-lg font-semibold text-gray-900">
                      약 {campaign.spec.schedule.estimated_duration_days}일
                    </p>
                  </div>
                )}

                {/* CTA 버튼 */}
                {canApply ? (
                  <button
                    onClick={handleApply}
                    disabled={applying}
                    className="
                      w-full py-4 px-6
                      bg-purple-600 text-white
                      font-bold text-lg rounded-xl
                      hover:bg-purple-700
                      disabled:bg-purple-300
                      transition-colors
                    "
                  >
                    {applying ? '지원 중...' : '지원하기'}
                  </button>
                ) : hasApplied ? (
                  <div className="text-center py-4 px-6 bg-green-50 text-green-700 font-medium rounded-xl">
                    이미 지원했습니다
                  </div>
                ) : isOwner ? (
                  <Link
                    href={`/advertiser/campaigns/${campaignId}`}
                    className="
                      block w-full py-4 px-6 text-center
                      bg-purple-600 text-white
                      font-bold rounded-xl
                      hover:bg-purple-700
                      transition-colors
                    "
                  >
                    캠페인 관리하기
                  </Link>
                ) : !user ? (
                  <Link
                    href="/auth/login"
                    className="
                      block w-full py-4 px-6 text-center
                      bg-purple-600 text-white
                      font-bold rounded-xl
                      hover:bg-purple-700
                      transition-colors
                    "
                  >
                    로그인하고 지원하기
                  </Link>
                ) : campaign.status !== 'OPEN' ? (
                  <div className="text-center py-4 px-6 bg-gray-100 text-gray-500 font-medium rounded-xl">
                    모집이 마감되었습니다
                  </div>
                ) : (
                  <div className="text-center py-4 px-6 bg-gray-100 text-gray-500 font-medium rounded-xl">
                    지원할 수 없습니다
                  </div>
                )}

                {/* 문의 버튼 */}
                <button
                  className="
                    w-full mt-3 py-3 px-6
                    bg-gray-100 text-gray-700
                    font-medium rounded-xl
                    hover:bg-gray-200
                    transition-colors
                  "
                >
                  문의하기
                </button>

                {/* 부가 정보 */}
                <div className="mt-6 pt-6 border-t border-gray-100 space-y-3 text-sm text-gray-500">
                  {campaign.createdAt && (
                    <div className="flex justify-between">
                      <span>등록일</span>
                      <span className="text-gray-900">
                        {new Date(campaign.createdAt).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>캠페인 ID</span>
                    <span className="text-gray-900 font-mono text-xs">{campaign.id.slice(0, 8)}...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
