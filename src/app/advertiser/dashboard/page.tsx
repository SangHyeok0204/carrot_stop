'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TopNav, CampaignList } from '@/components/shared';
import { useCampaigns, CampaignStatus } from '@/contexts';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';

// ============================================
// Stats Card Component
// ============================================

interface StatCardProps {
  icon: string;
  label: string;
  value: number;
  color: string;
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-purple-100 p-6 hover:shadow-lg hover:border-purple-200 transition-all duration-300">
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 rounded-xl ${color} flex items-center justify-center text-2xl`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Filter Tabs Component
// ============================================

type FilterStatus = 'all' | CampaignStatus;

interface FilterTabsProps {
  activeFilter: FilterStatus;
  onFilterChange: (filter: FilterStatus) => void;
  counts: Record<FilterStatus, number>;
}

function FilterTabs({ activeFilter, onFilterChange, counts }: FilterTabsProps) {
  const filters: { key: FilterStatus; label: string }[] = [
    { key: 'all', label: '전체' },
    { key: 'OPEN', label: '모집중' },
    { key: 'IN_PROGRESS', label: '진행중' },
    { key: 'COMPLETED', label: '완료' },
  ];

  return (
    <div className="flex gap-2 flex-wrap">
      {filters.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onFilterChange(key)}
          className={`
            px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
            ${activeFilter === key
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-white text-gray-600 border border-purple-100 hover:border-purple-300 hover:bg-purple-50'
            }
          `}
        >
          {label}
          <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
            activeFilter === key ? 'bg-purple-500' : 'bg-gray-100'
          }`}>
            {counts[key]}
          </span>
        </button>
      ))}
    </div>
  );
}

// ============================================
// Dashboard Page
// ============================================

export default function AdvertiserDashboardPage() {
  const router = useRouter();
  const { campaigns, fetchMyCampaigns, isLoading } = useCampaigns();
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');
  const [user, setUser] = useState<{ uid: string; displayName: string | null } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

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

          if (data.success && data.data?.role === 'advertiser') {
            setUser({
              uid: firebaseUser.uid,
              displayName: data.data.displayName || firebaseUser.displayName,
            });
          } else {
            // 광고주가 아니면 메인으로 리다이렉트
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
      fetchMyCampaigns();
    }
  }, [user, fetchMyCampaigns]);

  // 내 캠페인
  const myCampaigns = campaigns;

  // 필터링된 캠페인
  const filteredCampaigns = activeFilter === 'all'
    ? myCampaigns
    : myCampaigns.filter(c => c.status === activeFilter);

  // 상태별 개수
  const counts: Record<FilterStatus, number> = {
    all: myCampaigns.length,
    OPEN: myCampaigns.filter(c => c.status === 'OPEN').length,
    IN_PROGRESS: myCampaigns.filter(c => c.status === 'IN_PROGRESS').length,
    COMPLETED: myCampaigns.filter(c => c.status === 'COMPLETED').length,
    CANCELLED: myCampaigns.filter(c => c.status === 'CANCELLED').length,
  };

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

      {/* 메인 컨텐츠 */}
      <main className="pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {/* 헤더 */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  안녕하세요, <span className="text-purple-600">{user?.displayName || '광고주'}</span>님! 👋
                </h1>
                <p className="text-gray-600">
                  캠페인 현황을 확인하고 새로운 캠페인을 만들어보세요
                </p>
              </div>

              <Link
                href="/advertiser/campaigns/new"
                className="
                  inline-flex items-center justify-center gap-2
                  px-6 py-3 rounded-xl
                  bg-gradient-to-r from-purple-600 to-violet-600
                  text-white font-semibold
                  hover:from-purple-700 hover:to-violet-700
                  active:scale-95
                  transition-all duration-200
                  shadow-lg shadow-purple-200
                "
              >
                <span className="text-xl">+</span>
                새 캠페인 만들기
              </Link>
            </div>
          </div>

          {/* 통계 카드 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <StatCard
              icon="📢"
              label="전체 캠페인"
              value={counts.all}
              color="bg-purple-100"
            />
            <StatCard
              icon="🟢"
              label="모집중"
              value={counts.OPEN}
              color="bg-green-100"
            />
            <StatCard
              icon="🔄"
              label="진행중"
              value={counts.IN_PROGRESS}
              color="bg-blue-100"
            />
            <StatCard
              icon="👥"
              label="총 지원자"
              value={totalApplications}
              color="bg-orange-100"
            />
          </div>

          {/* 캠페인 섹션 */}
          <section className="bg-white rounded-3xl border border-purple-100 p-6 sm:p-8">
            {/* 섹션 헤더 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                내 캠페인
              </h2>
              <FilterTabs
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                counts={counts}
              />
            </div>

            {/* 캠페인 목록 */}
            {myCampaigns.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📭</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  아직 등록한 캠페인이 없어요
                </h3>
                <p className="text-gray-500 mb-6">
                  첫 번째 캠페인을 만들어 인플루언서를 모집해보세요!
                </p>
                <Link
                  href="/advertiser/campaigns/new"
                  className="
                    inline-flex items-center gap-2
                    px-6 py-3 rounded-xl
                    bg-purple-600 text-white font-medium
                    hover:bg-purple-700
                    transition-colors
                  "
                >
                  <span>+</span>
                  첫 캠페인 만들기
                </Link>
              </div>
            ) : filteredCampaigns.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">🔍</div>
                <p className="text-gray-500">
                  해당 상태의 캠페인이 없습니다
                </p>
              </div>
            ) : (
              <CampaignList
                campaigns={filteredCampaigns}
                variant="grid"
                showStatus={true}
                showAdvertiser={false}
                columns={3}
              />
            )}
          </section>

          {/* 퀵 액션 섹션 */}
          <section className="mt-10">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              바로가기
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link
                href="/advertiser/campaigns/new"
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
                  ✨
                </div>
                <div>
                  <h3 className="font-semibold">새 캠페인 만들기</h3>
                  <p className="text-sm text-purple-100">AI가 기획서를 만들어드려요</p>
                </div>
              </Link>

              <Link
                href="/main"
                className="
                  flex items-center gap-4 p-5 rounded-2xl
                  bg-white border border-purple-100
                  hover:border-purple-300 hover:shadow-lg
                  transition-all duration-300
                  group
                "
              >
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  🏠
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">메인으로</h3>
                  <p className="text-sm text-gray-500">모든 캠페인 둘러보기</p>
                </div>
              </Link>

              <div className="
                flex items-center gap-4 p-5 rounded-2xl
                bg-white border border-purple-100
                opacity-60 cursor-not-allowed
              ">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl">
                  📊
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">분석 리포트</h3>
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
