'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MAIN_CAMPAIGNS, CAMPAIGN_STATS } from '@/lib/mock/mainCampaigns';
import { CampaignCard } from './CampaignCard';
import { FloatingCharacters } from './FloatingCharacters';

export function RadialHero() {
  const [rotation, setRotation] = useState(0);
  const [showGuide, setShowGuide] = useState(true);
  const [isHeroHovered, setIsHeroHovered] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const campaigns = MAIN_CAMPAIGNS;

  // 가이드 문구 숨기기
  useEffect(() => {
    const timer = setTimeout(() => setShowGuide(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  // 휠 이벤트 핸들러 (양쪽 150px 영역 제외)
  const handleWheel = useCallback((e: WheelEvent) => {
    if (!isHeroHovered) return;

    // 양쪽 150px 영역에서는 일반 스크롤 허용
    const edgeMargin = 150;
    const mouseX = e.clientX;
    const windowWidth = window.innerWidth;

    if (mouseX < edgeMargin || mouseX > windowWidth - edgeMargin) {
      return; // 양쪽 가장자리에서는 일반 스크롤
    }

    e.preventDefault();
    const delta = e.deltaY > 0 ? 1 : -1;
    setRotation((prev) => prev + delta * 15);
    setShowGuide(false);
  }, [isHeroHovered]);

  // 휠 이벤트 등록
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

  // 모바일용 버튼 핸들러
  const handlePrev = () => {
    setRotation((prev) => prev - 30);
    setShowGuide(false);
  };

  const handleNext = () => {
    setRotation((prev) => prev + 30);
    setShowGuide(false);
  };

  // 카드 위치 계산 (부분 원호 배치)
  const getCardPosition = (index: number, total: number) => {
    const anglePerCard = 25; // 카드 간 각도
    const startAngle = -90 - ((total - 1) * anglePerCard) / 2;
    const angle = startAngle + index * anglePerCard + rotation;
    const radian = (angle * Math.PI) / 180;

    // 원호 반경 (화면 크기에 따라 조정)
    const radius = typeof window !== 'undefined'
      ? Math.min(window.innerWidth * 0.38, 450)
      : 400;

    const x = Math.cos(radian) * radius;
    const y = Math.sin(radian) * radius * 0.5 + radius * 0.3;

    // 깊이감을 위한 스케일과 z-index
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

        {/* 동적 상태 인디케이터 */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            총 <strong className="text-purple-600">{CAMPAIGN_STATS.totalRecruiting}개</strong>의 캠페인이 모집 중
          </span>
          <span className="hidden sm:block text-gray-300">|</span>
          <span className="flex items-center gap-1.5">
            🔥 이번 주 마감 <strong className="text-orange-500">{CAMPAIGN_STATS.deadlineThisWeek}건</strong>
          </span>
        </div>
      </div>

      {/* 부유하는 캐릭터들 */}
      <FloatingCharacters />

      {/* 원호 캠페인 카드들 */}
      <div className="absolute left-1/2 top-[55%] -translate-x-1/2">
        {campaigns.map((campaign, index) => {
          const position = getCardPosition(index, campaigns.length);
          return (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
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

      {/* 모바일용 좌/우 버튼 */}
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

      {/* 데스크탑용 좌/우 버튼 (선택적 키보드 대안) */}
      <div className="hidden sm:flex absolute bottom-8 right-8 gap-2 z-30">
        <button
          onClick={handlePrev}
          className="w-10 h-10 bg-white/80 backdrop-blur-sm shadow-md rounded-full flex items-center justify-center text-purple-600 hover:bg-purple-100 transition-all border border-purple-100"
          title="왼쪽 (←)"
        >
          ‹
        </button>
        <button
          onClick={handleNext}
          className="w-10 h-10 bg-white/80 backdrop-blur-sm shadow-md rounded-full flex items-center justify-center text-purple-600 hover:bg-purple-100 transition-all border border-purple-100"
          title="오른쪽 (→)"
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
