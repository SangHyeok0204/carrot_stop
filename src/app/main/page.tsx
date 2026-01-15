'use client';

import { useEffect, useState, useRef, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TopNav } from '@/components/shared';
import { CampaignList } from '@/components/shared';
import { useCampaigns, CampaignCategory } from '@/contexts';

// ============================================
// Category Data (업종/유형 기반) - 이모지 대신 도형/중립 아이콘 사용
// ============================================

const categories: { id: CampaignCategory; name: string; color: string }[] = [
  { id: '카페', name: '카페', color: 'bg-amber-100 text-amber-600' },
  { id: '음식점', name: '음식점', color: 'bg-orange-100 text-orange-600' },
  { id: '바/주점', name: '바/주점', color: 'bg-purple-100 text-purple-600' },
  { id: '뷰티/미용', name: '뷰티/미용', color: 'bg-pink-100 text-pink-600' },
  { id: '패션/의류', name: '패션/의류', color: 'bg-rose-100 text-rose-600' },
  { id: '스포츠/피트니스', name: '스포츠', color: 'bg-green-100 text-green-600' },
  { id: '페스티벌/행사', name: '페스티벌', color: 'bg-violet-100 text-violet-600' },
  { id: '서포터즈', name: '서포터즈', color: 'bg-blue-100 text-blue-600' },
  { id: '리뷰/체험단', name: '리뷰/체험단', color: 'bg-teal-100 text-teal-600' },
  { id: '기타', name: '기타', color: 'bg-slate-100 text-slate-600' },
];

// ============================================
// Search Bar Section (통계 제거)
// ============================================

function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <section className="pt-24 pb-12 px-4 relative">
      <div className="max-w-3xl mx-auto relative z-10">
        {/* 검색바 */}
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            name="search"
            id="main-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="캠페인, 광고주, 인플루언서를 검색하세요"
            className="
              w-full px-6 py-5 pr-14
              bg-white/90 backdrop-blur-sm rounded-2xl
              border-2 border-purple-100
              text-lg text-gray-800
              placeholder:text-gray-400
              shadow-xl shadow-purple-100/50
              focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-100
              transition-all duration-200
            "
          />
          <button
            type="submit"
            className="
              absolute right-4 top-1/2 -translate-y-1/2
              w-10 h-10 rounded-xl
              bg-purple-600 text-white
              flex items-center justify-center
              hover:bg-purple-700 transition-colors
            "
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </form>
      </div>
    </section>
  );
}

// ============================================
// Category Filter Section (이모지 대신 컬러 도트)
// ============================================

function CategoryFilter() {
  return (
    <section className="py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-lg font-bold text-gray-900 mb-4">카테고리별 캠페인</h2>
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 sm:gap-3">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/campaigns/category/${encodeURIComponent(category.id)}`}
              className="
                flex flex-col items-center justify-center
                p-3 sm:p-4 rounded-xl
                bg-white/80 backdrop-blur-sm
                border border-purple-50
                hover:border-purple-300 hover:shadow-md hover:-translate-y-0.5
                transition-all duration-200
                group cursor-pointer
              "
            >
              {/* 이모지 대신 컬러 도트 */}
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full ${category.color} flex items-center justify-center mb-1 group-hover:scale-110 transition-transform`}>
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-current opacity-60" />
              </div>
              <span className="text-xs font-medium text-gray-700 group-hover:text-purple-600 transition-colors text-center">
                {category.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================
// Campaign Grid Section (무한 스크롤)
// ============================================

function CampaignGridSection() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  // 초기 데이터 로드
  useEffect(() => {
    loadCampaigns(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 무한 스크롤 감지
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          loadCampaigns(false);
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, isLoadingMore, isLoading]);

  const loadCampaigns = async (isInitial: boolean) => {
    if (isInitial) {
      setIsLoading(true);
      setCampaigns([]);
      setCursor(null);
    } else {
      setIsLoadingMore(true);
    }

    try {
      // 초기 로드는 더 많이, 추가 로드는 12개씩
      const limit = isInitial ? 20 : 12;
      const url = cursor
        ? `/api/campaigns/latest?limit=${limit}&cursor=${cursor}`
        : `/api/campaigns/latest?limit=${limit}`;

      const response = await fetch(url);
      const result = await response.json();

      if (result.success && result.data) {
        const newCampaigns = result.data.campaigns || [];
        
        // CampaignListItem 형식으로 변환
        const currentCampaignsCount = isInitial ? 0 : campaigns.length;
        const transformedCampaigns = newCampaigns.map((campaign: any, index: number) => {
          const deadlineDate = new Date(campaign.deadline || new Date().toISOString());
          const now = new Date();
          const daysUntilDeadline = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          const isHot = daysUntilDeadline <= 7 && daysUntilDeadline >= 0;

          // 이미지 URL: API에서 제공되면 사용, 없으면 placeholder
          const imageUrl = campaign.imageUrl || undefined;

          return {
            id: campaign.id,
            advertiserId: '',
            advertiserName: campaign.advertiserName,
            title: campaign.title || '',
            description: campaign.description || '',
            objective: campaign.objective || '인지도',
            channel: campaign.channel || 'Instagram', // 기본값은 있지만 실제로는 데이터가 있어야 함
            budgetRange: campaign.budgetRange || '10-30만',
            category: campaign.category || '기타',
            status: 'OPEN',
            deadline: campaign.deadline || new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString().split('T')[0],
            applicationsCount: campaign.applicationsCount || 0,
            isHot: campaign.isHot ?? isHot,
            imageUrl: imageUrl,
          };
        });

        if (isInitial) {
          setCampaigns(transformedCampaigns);
        } else {
          setCampaigns((prev) => [...prev, ...transformedCampaigns]);
        }

        setCursor(result.data.nextCursor);
        setHasMore(!!result.data.nextCursor);
      }
    } catch (error) {
      console.error('Failed to load campaigns:', error);
      setHasMore(false);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  if (isLoading) {
    return (
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-500">캠페인을 불러오는 중...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* 섹션 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              모집 중인 캠페인
            </h2>
            <p className="text-gray-500 mt-1">
              {campaigns.length}개의 캠페인이 인플루언서를 찾고 있어요
            </p>
          </div>
        </div>

        {/* 4열 그리드 */}
        {campaigns.length > 0 ? (
          <>
            <CampaignList
              campaigns={campaigns}
              variant="grid"
              columns={4}
              showStatus={true}
              showAdvertiser={true}
              emptyMessage="현재 모집 중인 캠페인이 없습니다"
            />
            
            {/* 무한 스크롤 트리거 */}
            <div ref={observerTarget} className="h-20 flex items-center justify-center">
              {isLoadingMore && (
                <div className="flex items-center gap-2 text-gray-500">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                  <span>더 많은 캠페인을 불러오는 중...</span>
                </div>
              )}
              {!hasMore && campaigns.length > 0 && (
                <p className="text-gray-400 text-sm">모든 캠페인을 불러왔습니다</p>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">현재 모집 중인 캠페인이 없습니다</p>
          </div>
        )}
      </div>
    </section>
  );
}

// ============================================
// Main Page
// ============================================

export default function MainPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-purple-50/30">
      {/* 배경 장식 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-20 left-10 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl" />
        <div className="absolute top-60 right-10 w-80 h-80 bg-violet-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-40 left-1/3 w-72 h-72 bg-purple-100/20 rounded-full blur-3xl" />
      </div>

      {/* TopNav */}
      <TopNav transparent />

      <div className="relative z-10">
        <SearchBar />
        <CategoryFilter />
        <CampaignGridSection />

        <footer className="py-8 px-4 bg-gray-900 border-t border-gray-800">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-500">© 2026 I:EUM. All rights reserved.</p>
              <a
                href="https://www.instagram.com/brand_ieum/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-label="Instagram"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                <span className="text-sm font-medium">@brand_ieum</span>
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
