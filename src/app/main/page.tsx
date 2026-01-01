'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { TopNav } from '@/components/shared';
import { CampaignCard } from '@/components/shared';
import { CampaignList } from '@/components/shared';
import { useCampaigns, Campaign } from '@/contexts';

// ============================================
// Floating Characters Component
// ============================================

function FloatingCharacters() {
  return (
    <>
      <div
        className="absolute left-[15%] top-[25%] pointer-events-none"
        style={{ animation: 'float 5s ease-in-out infinite 0.5s' }}
      >
        <div className="text-3xl sm:text-4xl select-none opacity-80">
          ✨
        </div>
      </div>

      <div
        className="absolute right-[18%] top-[20%] pointer-events-none"
        style={{ animation: 'float 4.5s ease-in-out infinite 1s' }}
      >
        <div className="text-3xl sm:text-4xl select-none opacity-80">
          💡
        </div>
      </div>

      <div
        className="absolute left-[20%] bottom-[25%] pointer-events-none"
        style={{ animation: 'float 5.5s ease-in-out infinite 0.3s' }}
      >
        <div className="text-2xl sm:text-3xl select-none opacity-70">
          🎯
        </div>
      </div>

      <div
        className="absolute right-[15%] bottom-[30%] pointer-events-none"
        style={{ animation: 'float 4s ease-in-out infinite 1.5s' }}
      >
        <div className="text-2xl sm:text-3xl select-none opacity-70">
          💜
        </div>
      </div>

      <style jsx global>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </>
  );
}

// ============================================
// Radial Hero Component
// ============================================

function RadialHero() {
  const [rotation, setRotation] = useState(0);
  const [showGuide, setShowGuide] = useState(true);
  const [isHeroHovered, setIsHeroHovered] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  // Context에서 캠페인 데이터 가져오기
  const { campaigns, getOpenCampaigns, getStats, fetchCampaigns, isLoading } = useCampaigns();
  const openCampaigns = getOpenCampaigns();
  const stats = getStats();

  // 페이지 로드 시 캠페인 fetch
  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // 가이드 문구 숨기기
  useEffect(() => {
    const timer = setTimeout(() => setShowGuide(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  // 휠 이벤트 핸들러
  const handleWheel = useCallback((e: WheelEvent) => {
    if (!isHeroHovered) return;

    const edgeMargin = 150;
    const mouseX = e.clientX;
    const windowWidth = window.innerWidth;

    if (mouseX < edgeMargin || mouseX > windowWidth - edgeMargin) {
      return;
    }

    e.preventDefault();
    const delta = e.deltaY > 0 ? 1 : -1;
    setRotation((prev) => prev + delta * 15);
    setShowGuide(false);
  }, [isHeroHovered]);

  useEffect(() => {
    const heroElement = heroRef.current;
    if (!heroElement) return;

    heroElement.addEventListener('wheel', handleWheel, { passive: false });
    return () => heroElement.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // 키보드 네비게이션
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isHeroHovered) return;

    if (e.key === 'ArrowLeft') {
      setRotation((prev) => prev - 20);
      setShowGuide(false);
    } else if (e.key === 'ArrowRight') {
      setRotation((prev) => prev + 20);
      setShowGuide(false);
    }
  }, [isHeroHovered]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handlePrev = () => {
    setRotation((prev) => prev - 30);
    setShowGuide(false);
  };

  const handleNext = () => {
    setRotation((prev) => prev + 30);
    setShowGuide(false);
  };

  // 카드 위치 계산
  const getCardPosition = (index: number, total: number) => {
    const anglePerCard = 25;
    const startAngle = -90 - ((total - 1) * anglePerCard) / 2;
    const angle = startAngle + index * anglePerCard + rotation;
    const radian = (angle * Math.PI) / 180;

    const radius = typeof window !== 'undefined'
      ? Math.min(window.innerWidth * 0.38, 450)
      : 400;

    const x = Math.cos(radian) * radius;
    const y = Math.sin(radian) * radius * 0.5 + radius * 0.3;

    const normalizedAngle = ((angle % 360) + 360) % 360;
    const distanceFromTop = Math.abs(normalizedAngle - 270);
    const scale = 1 - (distanceFromTop / 360) * 0.4;
    const zIndex = Math.round((1 - distanceFromTop / 180) * 100);
    const opacity = 0.4 + scale * 0.6;

    return {
      transform: `translate(${x}px, ${y}px) scale(${scale})`,
      zIndex,
      opacity,
    };
  };

  return (
    <section
      ref={heroRef}
      onMouseEnter={() => setIsHeroHovered(true)}
      onMouseLeave={() => setIsHeroHovered(false)}
      className="relative min-h-screen bg-gradient-to-b from-purple-50 via-white to-purple-50 overflow-hidden pt-16"
    >
      {/* 배경 장식 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-purple-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-violet-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-40 h-40 bg-pink-200/20 rounded-full blur-2xl" />
      </div>

      {/* 중앙 텍스트 */}
      <div className="absolute top-[15%] left-1/2 -translate-x-1/2 text-center z-20 px-4">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
          <span className="bg-gradient-to-r from-purple-600 via-violet-500 to-purple-600 bg-clip-text text-transparent">
            지금 모집 중인 캠페인에
          </span>
          <br />
          <span className="bg-gradient-to-r from-violet-500 to-purple-600 bg-clip-text text-transparent">
            지원하세요!
          </span>
        </h1>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            총 <strong className="text-purple-600">{stats.totalRecruiting}개</strong>의 캠페인이 모집 중
          </span>
          <span className="hidden sm:block text-gray-300">|</span>
          <span className="flex items-center gap-1.5">
            🔥 이번 주 마감 <strong className="text-orange-500">{stats.deadlineThisWeek}건</strong>
          </span>
        </div>
      </div>

      <FloatingCharacters />

      {/* 원호 캠페인 카드들 */}
      <div className="absolute left-1/2 top-[55%] -translate-x-1/2">
        {openCampaigns.map((campaign, index) => {
          const position = getCardPosition(index, openCampaigns.length);
          return (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              variant="radial"
              style={{
                ...position,
                transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              }}
            />
          );
        })}
      </div>

      {/* 가이드 문구 */}
      {showGuide && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30">
          <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-purple-100 text-sm text-gray-600 animate-pulse">
            <span className="hidden sm:inline">🖱️ 스크롤로 캠페인을 탐색하세요</span>
            <span className="sm:hidden">👆 버튼으로 캠페인을 탐색하세요</span>
          </div>
        </div>
      )}

      {/* 모바일용 버튼 */}
      <div className="sm:hidden absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-4 z-30">
        <button
          onClick={handlePrev}
          className="w-12 h-12 bg-white shadow-lg rounded-full flex items-center justify-center text-purple-600 hover:bg-purple-50 active:scale-95 transition-all border border-purple-100"
        >
          ←
        </button>
        <button
          onClick={handleNext}
          className="w-12 h-12 bg-white shadow-lg rounded-full flex items-center justify-center text-purple-600 hover:bg-purple-50 active:scale-95 transition-all border border-purple-100"
        >
          →
        </button>
      </div>

      {/* 데스크탑용 버튼 */}
      <div className="hidden sm:flex absolute bottom-8 right-8 gap-2 z-30">
        <button
          onClick={handlePrev}
          className="w-10 h-10 bg-white/80 backdrop-blur-sm shadow-md rounded-full flex items-center justify-center text-purple-600 hover:bg-purple-100 transition-all border border-purple-100"
        >
          ‹
        </button>
        <button
          onClick={handleNext}
          className="w-10 h-10 bg-white/80 backdrop-blur-sm shadow-md rounded-full flex items-center justify-center text-purple-600 hover:bg-purple-100 transition-all border border-purple-100"
        >
          ›
        </button>
      </div>

      {/* 스크롤 다운 인디케이터 */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 hidden sm:block">
        <div className="flex flex-col items-center gap-1 text-gray-400">
          <span className="text-xs">아래로 스크롤</span>
          <div className="w-5 h-8 border-2 border-gray-300 rounded-full flex justify-center pt-1.5">
            <div className="w-1 h-2 bg-gray-400 rounded-full animate-bounce" />
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// Campaign Grid Section
// ============================================

function CampaignGridSection() {
  const { getOpenCampaigns, isLoading } = useCampaigns();
  const campaigns = getOpenCampaigns();

  if (isLoading) {
    return (
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-500">캠페인을 불러오는 중...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-600 to-violet-500 bg-clip-text text-transparent">
              모집 중인 캠페인
            </span>
          </h2>
          <p className="text-gray-600">
            지금 바로 지원 가능한 캠페인을 확인하세요
          </p>
        </div>

        <CampaignList
          campaigns={campaigns}
          variant="grid"
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
    <div className="min-h-screen">
      <TopNav transparent />

      <RadialHero />

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
