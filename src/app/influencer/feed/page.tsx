'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TopNav, CampaignList } from '@/components/shared';
import { useCampaigns, Objective, Channel, BudgetRange } from '@/contexts';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';

// ============================================
// Filter Types
// ============================================

type ObjectiveFilter = 'all' | Objective;
type ChannelFilter = 'all' | Channel;
type BudgetFilter = 'all' | BudgetRange;

// ============================================
// Filter Chip Component
// ============================================

interface FilterChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function FilterChip({ label, active, onClick }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={`
        px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
        ${active
          ? 'bg-purple-600 text-white shadow-md'
          : 'bg-white text-gray-600 border border-purple-100 hover:border-purple-300 hover:bg-purple-50'
        }
      `}
    >
      {label}
    </button>
  );
}

// ============================================
// Filter Section Component
// ============================================

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
}

function FilterSection({ title, children }: FilterSectionProps) {
  return (
    <div>
      <h3 className="text-sm font-medium text-gray-700 mb-2">{title}</h3>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

// ============================================
// Stats Card Component
// ============================================

interface StatCardProps {
  icon: string;
  label: string;
  value: number | string;
  color: string;
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-purple-100 p-5 hover:shadow-lg hover:border-purple-200 transition-all duration-300">
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-xl`}>
          {icon}
        </div>
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Influencer Feed Page
// ============================================

export default function InfluencerFeedPage() {
  const router = useRouter();
  const { getOpenCampaigns, getStats, fetchOpenCampaigns, isLoading } = useCampaigns();
  const [user, setUser] = useState<{ uid: string; displayName: string | null } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // 필터 상태
  const [objectiveFilter, setObjectiveFilter] = useState<ObjectiveFilter>('all');
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('all');
  const [budgetFilter, setBudgetFilter] = useState<BudgetFilter>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Firebase Auth 상태 확인
  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          const response = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          const data = await response.json();

          if (data.success && data.data?.role === 'influencer') {
            setUser({
              uid: firebaseUser.uid,
              displayName: data.data.displayName || firebaseUser.displayName,
            });
          } else {
            // 인플루언서가 아니면 메인으로 리다이렉트
            router.push('/main');
          }
        } catch (e) {
          console.error('Auth error:', e);
          router.push('/auth/login');
        }
      } else {
        router.push('/auth/login');
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // 캠페인 데이터 fetch
  useEffect(() => {
    if (user) {
      fetchOpenCampaigns();
    }
  }, [user, fetchOpenCampaigns]);

  // 모든 OPEN 상태 캠페인
  const openCampaigns = getOpenCampaigns();
  const stats = getStats();

  // 필터링 (안전하게 처리)
  const filteredCampaigns = openCampaigns.filter(campaign => {
    if (!campaign) return false;
    if (objectiveFilter !== 'all' && campaign.objective !== objectiveFilter) return false;
    if (channelFilter !== 'all' && campaign.channel !== channelFilter) return false;
    if (budgetFilter !== 'all' && campaign.budgetRange !== budgetFilter) return false;
    return true;
  });

  // 필터 옵션
  const objectives: { key: ObjectiveFilter; label: string }[] = [
    { key: 'all', label: '전체' },
    { key: '인지도', label: '👁️ 인지도' },
    { key: '방문유도', label: '🔗 방문유도' },
    { key: '구매전환', label: '💳 구매전환' },
    { key: '팔로우·구독', label: '❤️ 팔로우·구독' },
  ];

  const channels: { key: ChannelFilter; label: string }[] = [
    { key: 'all', label: '전체' },
    { key: 'Instagram', label: '📸 Instagram' },
    { key: 'YouTube', label: '🎬 YouTube' },
    { key: 'TikTok', label: '🎵 TikTok' },
  ];

  const budgets: { key: BudgetFilter; label: string }[] = [
    { key: 'all', label: '전체' },
    { key: '10만 미만', label: '~10만' },
    { key: '10-30만', label: '10-30만' },
    { key: '30-50만', label: '30-50만' },
    { key: '50-100만', label: '50-100만' },
    { key: '100만+', label: '100만+' },
  ];

  const activeFiltersCount = [objectiveFilter, channelFilter, budgetFilter].filter(f => f !== 'all').length;

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

      {/* 메인 컨텐츠 */}
      <main className="pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              안녕하세요, <span className="text-purple-600">{user?.displayName || '크리에이터'}</span>님! 👋
            </h1>
            <p className="text-gray-600">
              지금 참여할 수 있는 캠페인을 찾아보세요
            </p>
          </div>

          {/* 통계 카드 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon="📢"
              label="모집 중인 캠페인"
              value={stats.totalRecruiting}
              color="bg-green-100"
            />
            <StatCard
              icon="🔥"
              label="이번 주 마감"
              value={stats.deadlineThisWeek}
              color="bg-orange-100"
            />
            <StatCard
              icon="🎯"
              label="필터 결과"
              value={filteredCampaigns.length}
              color="bg-purple-100"
            />
            <StatCard
              icon="⭐"
              label="내 지원"
              value="0건"
              color="bg-blue-100"
            />
          </div>

          {/* 필터 토글 버튼 */}
          <div className="mb-6">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`
                inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                transition-all duration-200
                ${showFilters
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 border border-purple-100 hover:border-purple-300'
                }
              `}
            >
              <span>🔍</span>
              필터
              {activeFiltersCount > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  showFilters ? 'bg-purple-500' : 'bg-purple-100 text-purple-600'
                }`}>
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {activeFiltersCount > 0 && (
              <button
                onClick={() => {
                  setObjectiveFilter('all');
                  setChannelFilter('all');
                  setBudgetFilter('all');
                }}
                className="ml-3 text-sm text-purple-600 hover:text-purple-700 hover:underline"
              >
                필터 초기화
              </button>
            )}
          </div>

          {/* 필터 패널 */}
          {showFilters && (
            <div className="bg-white rounded-2xl border border-purple-100 p-6 mb-8 space-y-6">
              <FilterSection title="캠페인 목적">
                {objectives.map(({ key, label }) => (
                  <FilterChip
                    key={key}
                    label={label}
                    active={objectiveFilter === key}
                    onClick={() => setObjectiveFilter(key)}
                  />
                ))}
              </FilterSection>

              <FilterSection title="채널">
                {channels.map(({ key, label }) => (
                  <FilterChip
                    key={key}
                    label={label}
                    active={channelFilter === key}
                    onClick={() => setChannelFilter(key)}
                  />
                ))}
              </FilterSection>

              <FilterSection title="예산 범위">
                {budgets.map(({ key, label }) => (
                  <FilterChip
                    key={key}
                    label={label}
                    active={budgetFilter === key}
                    onClick={() => setBudgetFilter(key)}
                  />
                ))}
              </FilterSection>
            </div>
          )}

          {/* 캠페인 섹션 */}
          <section className="bg-white rounded-3xl border border-purple-100 p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                🔥 모집 중인 캠페인
                <span className="ml-2 text-purple-600">{filteredCampaigns.length}개</span>
              </h2>
            </div>

            <CampaignList
              campaigns={filteredCampaigns}
              variant="grid"
              showStatus={true}
              emptyMessage="조건에 맞는 캠페인이 없습니다. 필터를 조정해보세요!"
              emptyIcon="🔍"
              columns={3}
            />
          </section>

          {/* 퀵 액션 */}
          <section className="mt-10">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              바로가기
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link
                href="/main"
                className="
                  flex items-center gap-4 p-5 rounded-2xl
                  bg-gradient-to-r from-purple-500 to-violet-500
                  text-white
                  hover:from-purple-600 hover:to-violet-600
                  transition-all duration-300
                  group
                "
              >
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  🏠
                </div>
                <div>
                  <h3 className="font-semibold">메인 페이지</h3>
                  <p className="text-sm text-purple-100">모든 캠페인 둘러보기</p>
                </div>
              </Link>

              <div className="
                flex items-center gap-4 p-5 rounded-2xl
                bg-white border border-purple-100
                opacity-60 cursor-not-allowed
              ">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl">
                  📋
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">내 지원 현황</h3>
                  <p className="text-sm text-gray-500">준비 중...</p>
                </div>
              </div>

              <div className="
                flex items-center gap-4 p-5 rounded-2xl
                bg-white border border-purple-100
                opacity-60 cursor-not-allowed
              ">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl">
                  👤
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">프로필 관리</h3>
                  <p className="text-sm text-gray-500">준비 중...</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
