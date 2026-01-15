'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';

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
// Search Content Component (리다이렉트)
// ============================================

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const q = searchParams.get('q') || '';
    // 통합 검색 페이지로 리다이렉트
    router.replace(`/search${q ? `?q=${encodeURIComponent(q)}` : ''}`);
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-500">검색 페이지로 이동 중...</p>
      </div>
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
