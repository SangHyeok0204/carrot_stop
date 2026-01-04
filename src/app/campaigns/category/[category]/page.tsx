'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { TopNav } from '@/components/shared';
import { CampaignList } from '@/components/shared';
import { useCampaigns, CampaignCategory } from '@/contexts';

// ============================================
// Category Data
// ============================================

const categoryData: Record<CampaignCategory, { name: string; icon: string; description: string }> = {
  '카페': { name: '카페', icon: '☕', description: '카페 및 커피숍 관련 캠페인' },
  '음식점': { name: '음식점', icon: '🍜', description: '레스토랑 및 맛집 캠페인' },
  '바/주점': { name: '바/주점', icon: '🍸', description: '바, 펍, 와인바 캠페인' },
  '뷰티/미용': { name: '뷰티/미용', icon: '💄', description: '뷰티, 헤어, 네일 캠페인' },
  '패션/의류': { name: '패션/의류', icon: '👗', description: '패션 브랜드 및 의류 캠페인' },
  '스포츠/피트니스': { name: '스포츠/피트니스', icon: '🏃', description: '헬스, 요가, 스포츠 캠페인' },
  '페스티벌/행사': { name: '페스티벌/행사', icon: '🎪', description: '축제, 공연, 이벤트 캠페인' },
  '서포터즈': { name: '서포터즈', icon: '📣', description: '브랜드 서포터즈 모집' },
  '리뷰/체험단': { name: '리뷰/체험단', icon: '✍️', description: '제품 리뷰 및 체험단 모집' },
  '기타': { name: '기타', icon: '📦', description: '기타 다양한 캠페인' },
};

const allCategories: { id: CampaignCategory; name: string; icon: string }[] = [
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
// Page Component
// ============================================

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const categoryParam = decodeURIComponent(params.category as string) as CampaignCategory;

  const { getCampaignsByCategory, getOpenCampaigns, isLoading, fetchCampaigns } = useCampaigns();

  // 현재 카테고리 정보
  const currentCategory = categoryData[categoryParam];

  // 캠페인 필터링
  const filteredCampaigns = currentCategory
    ? getCampaignsByCategory(categoryParam)
    : getOpenCampaigns();

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // 유효하지 않은 카테고리인 경우
  if (!currentCategory) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNav />
        <div className="pt-24 text-center py-16">
          <span className="text-6xl mb-4 block">❓</span>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">카테고리를 찾을 수 없습니다</h1>
          <p className="text-gray-500 mb-6">유효하지 않은 카테고리입니다.</p>
          <Link
            href="/main"
            className="inline-block px-6 py-3 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-colors"
          >
            메인으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />

      {/* 헤더 */}
      <section className="bg-gradient-to-b from-purple-50 to-white pt-24 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* 뒤로가기 */}
          <Link
            href="/main"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-purple-600 mb-6 transition-colors"
          >
            <span>←</span>
            <span>메인으로</span>
          </Link>

          {/* 카테고리 정보 */}
          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl">{currentCategory.icon}</span>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {currentCategory.name}
              </h1>
              <p className="text-gray-600 mt-1">
                {currentCategory.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 카테고리 탭 */}
      <section className="bg-white border-b border-gray-200 sticky top-16 z-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-2 py-4 overflow-x-auto scrollbar-hide">
            {allCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/campaigns/category/${encodeURIComponent(cat.id)}`}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-full
                  whitespace-nowrap transition-all duration-200
                  ${categoryParam === cat.id
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-purple-100 hover:text-purple-700'
                  }
                `}
              >
                <span>{cat.icon}</span>
                <span className="font-medium">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 캠페인 목록 */}
      <section className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* 결과 수 */}
          <div className="mb-6">
            <p className="text-gray-600">
              <strong className="text-purple-600">{filteredCampaigns.length}개</strong>의 캠페인
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-500">캠페인을 불러오는 중...</p>
            </div>
          ) : (
            <CampaignList
              campaigns={filteredCampaigns}
              variant="grid"
              columns={3}
              showStatus={true}
              showAdvertiser={true}
              emptyMessage={`${currentCategory.name} 카테고리에 모집 중인 캠페인이 없습니다`}
              emptyIcon="📭"
            />
          )}
        </div>
      </section>

      {/* CTA */}
      {filteredCampaigns.length === 0 && !isLoading && (
        <section className="py-12 px-4 bg-gradient-to-r from-purple-600 to-violet-600">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              다른 카테고리도 확인해보세요
            </h2>
            <p className="text-purple-100 mb-6">
              다양한 캠페인이 기다리고 있습니다
            </p>
            <Link
              href="/main"
              className="inline-block px-8 py-3 bg-white text-purple-600 font-bold rounded-xl hover:bg-purple-50 transition-colors"
            >
              전체 캠페인 보기
            </Link>
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
