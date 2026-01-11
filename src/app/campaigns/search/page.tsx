'use client';

import { useEffect, useState, FormEvent, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { TopNav } from '@/components/shared';
import { CampaignList } from '@/components/shared';
import { useCampaigns, CampaignCategory } from '@/contexts';

// ============================================
// Category Data
// ============================================

const categories: { id: CampaignCategory; name: string; icon: string }[] = [
  { id: '카페', name: '카페', icon: '☕' },
  { id: '음식점', name: '음식점', icon: '🍜' },
  { id: '바/주점', name: '바/주점', icon: '🍸' },
  { id: '뷰티/미용', name: '뷰티/미용', icon: '💄' },
  { id: '패션/의류', name: '패션/의류', icon: '👗' },
  { id: '스포츠/피트니스', name: '스포츠', icon: '🏃' },
  { id: '페스티벌/행사', name: '페스티벌', icon: '🎪' },
  { id: '서포터즈', name: '서포터즈', icon: '📣' },
  { id: '리뷰/체험단', name: '리뷰/체험단', icon: '✍️' },
  { id: '기타', name: '기타', icon: '📦' },
];

// ============================================
// Search Content Component
// ============================================

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [inputValue, setInputValue] = useState(initialQuery);

  const { searchCampaigns, isLoading, fetchCampaigns } = useCampaigns();
  const results = searchCampaigns(query);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  useEffect(() => {
    const q = searchParams.get('q') || '';
    setQuery(q);
    setInputValue(q);
  }, [searchParams]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      router.push(`/campaigns/search?q=${encodeURIComponent(inputValue.trim())}`);
    }
  };

  const handleCategoryClick = (categoryId: CampaignCategory) => {
    router.push(`/campaigns/category/${encodeURIComponent(categoryId)}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />

      {/* 검색 헤더 */}
      <section className="bg-gradient-to-b from-purple-50 to-white pt-24 pb-8 px-4">
        <div className="max-w-3xl mx-auto">
          {/* 뒤로가기 */}
          <Link
            href="/main"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-purple-600 mb-6 transition-colors"
          >
            <span>←</span>
            <span>메인으로</span>
          </Link>

          {/* 검색바 */}
          <form onSubmit={handleSubmit} className="relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="어떤 광고를 찾고 계시나요?"
              className="
                w-full px-6 py-4 pr-14
                bg-white rounded-2xl
                border-2 border-purple-100
                text-lg text-gray-800
                placeholder:text-gray-400
                shadow-lg
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

      {/* 카테고리 빠른 필터 */}
      <section className="bg-white border-b border-gray-100 py-4 px-4 sticky top-16 z-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className={`
                  flex items-center gap-1.5 px-4 py-2 rounded-full
                  whitespace-nowrap transition-all duration-200
                  ${query.includes(category.name) || query.includes(category.id)
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-purple-100 hover:text-purple-700'
                  }
                `}
              >
                <span>{category.icon}</span>
                <span className="text-sm font-medium">{category.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 검색 결과 */}
      <section className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* 결과 헤더 */}
          <div className="mb-6">
            {query ? (
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  "<span className="text-purple-600">{query}</span>" 검색 결과
                </h1>
                <p className="text-gray-500 mt-1">
                  {results.length}개의 캠페인을 찾았습니다
                </p>
              </div>
            ) : (
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  캠페인 검색
                </h1>
                <p className="text-gray-500 mt-1">
                  검색어를 입력하거나 카테고리를 선택해주세요
                </p>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-500">캠페인을 검색하는 중...</p>
            </div>
          ) : query ? (
            <CampaignList
              campaigns={results}
              variant="grid"
              columns={3}
              showStatus={true}
              emptyMessage={`"${query}"에 대한 검색 결과가 없습니다`}
              emptyIcon="🔍"
            />
          ) : (
            <div className="text-center py-16">
              <span className="text-6xl mb-4 block">🔍</span>
              <p className="text-gray-500">검색어를 입력하거나 카테고리를 선택해주세요</p>
            </div>
          )}
        </div>
      </section>

      {/* 추천 카테고리 (결과 없을 때) */}
      {query && results.length === 0 && !isLoading && (
        <section className="py-8 px-4 bg-white border-t border-gray-100">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-4">다른 카테고리 둘러보기</h2>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className="
                    flex flex-col items-center justify-center
                    p-3 rounded-xl
                    bg-gray-50 border border-gray-100
                    hover:border-purple-300 hover:bg-purple-50
                    transition-all duration-200
                    group
                  "
                >
                  <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">
                    {category.icon}
                  </span>
                  <span className="text-xs font-medium text-gray-600 group-hover:text-purple-600">
                    {category.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 푸터 */}
      <footer className="py-8 px-4 bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto text-center text-sm text-gray-500">
          <p>© 2026 ads platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

// ============================================
// Page Component with Suspense
// ============================================

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
