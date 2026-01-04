'use client';

import { useEffect, useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TopNav } from '@/components/shared';
import { CampaignList } from '@/components/shared';
import { useCampaigns, CampaignCategory } from '@/contexts';

// ============================================
// Category Data (업종/유형 기반)
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
// Search Bar Section
// ============================================

function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const { getStats } = useCampaigns();
  const stats = getStats();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/campaigns/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <section className="bg-gradient-to-b from-purple-100 via-purple-50 to-white pt-24 pb-12 px-4 relative">
      {/* 배경 장식 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-64 h-64 bg-purple-200/30 rounded-full blur-3xl" />
        <div className="absolute top-40 right-10 w-80 h-80 bg-violet-200/30 rounded-full blur-3xl" />
      </div>

      <div className="max-w-3xl mx-auto relative z-10">
        {/* 검색바 */}
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="어떤 광고를 찾고 계시나요?"
            className="
              w-full px-6 py-5 pr-14
              bg-white rounded-2xl
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

        {/* 모집 현황 */}
        <div className="flex items-center justify-center gap-4 mt-6 text-sm text-gray-600">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            총 <strong className="text-purple-600">{stats.totalRecruiting}개</strong> 모집 중
          </span>
          <span className="text-gray-300">|</span>
          <span className="flex items-center gap-1.5">
            🔥 이번 주 마감 <strong className="text-orange-500">{stats.deadlineThisWeek}건</strong>
          </span>
        </div>
      </div>
    </section>
  );
}

// ============================================
// Category Filter Section
// ============================================

function CategoryFilter() {
  return (
    <section className="py-8 px-4 bg-white">
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
                bg-gradient-to-br from-gray-50 to-white
                border border-gray-100
                hover:border-purple-300 hover:shadow-md hover:-translate-y-0.5
                transition-all duration-200
                group cursor-pointer
              "
            >
              <span className="text-2xl sm:text-3xl mb-1 group-hover:scale-110 transition-transform">
                {category.icon}
              </span>
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
// Campaign Grid Section
// ============================================

function CampaignGridSection() {
  const { getOpenCampaigns, isLoading, fetchCampaigns } = useCampaigns();
  const campaigns = getOpenCampaigns();

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  if (isLoading) {
    return (
      <section className="py-12 px-4 bg-white">
        <div className="max-w-6xl mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-500">캠페인을 불러오는 중...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
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
          <Link
            href="/campaigns"
            className="text-purple-600 hover:text-purple-700 font-medium text-sm flex items-center gap-1"
          >
            전체보기 <span>→</span>
          </Link>
        </div>

        <CampaignList
          campaigns={campaigns}
          variant="grid"
          columns={3}
          showStatus={true}
          showAdvertiser={true}
          emptyMessage="현재 모집 중인 캠페인이 없습니다"
          emptyIcon="📭"
        />
      </div>
    </section>
  );
}

// ============================================
// Features Section
// ============================================

function FeaturesSection() {
  const features = [
    {
      icon: '🎯',
      title: '맞춤 캠페인 매칭',
      description: '내 채널과 스타일에 맞는 캠페인을 추천받으세요',
    },
    {
      icon: '⚡',
      title: '빠른 승인 프로세스',
      description: '신청 후 빠른 검토와 매칭을 경험하세요',
    },
    {
      icon: '💰',
      title: '투명한 보상 체계',
      description: '명확한 보상 기준과 빠른 정산',
    },
    {
      icon: '🤝',
      title: '안전한 거래',
      description: '플랫폼을 통한 안전한 계약과 보호',
    },
  ];

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-purple-50 to-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-600 to-violet-500 bg-clip-text text-transparent">
              왜 ads platform인가요?
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 border border-purple-100 hover:shadow-lg hover:border-purple-200 transition-all duration-300"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================
// CTA Section
// ============================================

function CTASection() {
  return (
    <section className="py-20 px-4 bg-gradient-to-r from-purple-600 to-violet-600">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
          지금 바로 시작하세요
        </h2>
        <p className="text-purple-100 text-lg mb-8">
          광고주든 인플루언서든, 새로운 기회가 기다리고 있습니다
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/auth/signup"
            className="px-8 py-4 bg-white text-purple-600 font-bold rounded-xl hover:bg-purple-50 transition-colors"
          >
            무료로 시작하기
          </a>
          <a
            href="/campaigns"
            className="px-8 py-4 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-400 transition-colors border border-purple-400"
          >
            캠페인 둘러보기
          </a>
        </div>
      </div>
    </section>
  );
}

// ============================================
// Main Page
// ============================================

export default function MainPage() {
  return (
    <div className="min-h-screen bg-white">
      <TopNav transparent />

      <SearchBar />

      <CategoryFilter />

      <CampaignGridSection />

      <FeaturesSection />

      <CTASection />

      <footer className="py-8 px-4 bg-white border-t border-purple-100">
        <div className="max-w-6xl mx-auto text-center text-sm text-gray-500">
          <p>© 2026 ads platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
