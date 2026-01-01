'use client';

import { MainTopNav } from '@/components/main/MainTopNav';
import { RadialHero } from '@/components/main/RadialHero';
import { PlaceholderSection } from '@/components/main/PlaceholderSection';

export default function MainPage() {
  return (
    <div className="min-h-screen">
      {/* 상단 헤더 */}
      <MainTopNav />

      {/* Hero 섹션 - 방사형 캠페인 브라우저 */}
      <RadialHero />

      {/* Placeholder 섹션 */}
      <PlaceholderSection />

      {/* 푸터 */}
      <footer className="py-8 px-4 bg-white border-t border-purple-100">
        <div className="max-w-6xl mx-auto text-center text-sm text-gray-500">
          <p>© 2026 ADS Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
