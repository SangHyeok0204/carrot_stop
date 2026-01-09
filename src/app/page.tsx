'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 페이지 로드 시 애니메이션 트리거
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section - 풀스크린 이미지 (첫 화면만) */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* 배경 이미지 */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hero.jpg"
            alt="Hero"
            fill
            className="object-cover"
            priority
            unoptimized
          />
        </div>

        {/* 오버레이 그라데이션 */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/60 z-10" />

        {/* 콘텐츠 */}
        <div className="relative z-20 max-w-7xl w-full text-center space-y-12 px-4 sm:px-6 lg:px-8 py-20">
          <div
            className={`transition-all duration-1000 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight leading-none text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
              브랜드와 고객을
              <br />
              <span className="text-white">잇다</span>
            </h1>
          </div>

          <div
            className={`transition-all duration-1000 delay-300 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <p className="text-2xl sm:text-3xl md:text-4xl text-white max-w-3xl mx-auto drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] font-medium">
              인플루언서 협업부터 브랜딩까지, 연결의 시작
            </p>
          </div>

          <div
            className={`transition-all duration-1000 delay-500 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg px-8 py-6 bg-white text-primary hover:bg-white/90 shadow-2xl">
                <Link href="/trial/start">무료 체험 시작</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6 border-2 border-white text-white hover:bg-white/20 bg-white/10 backdrop-blur-sm shadow-2xl">
                <Link href="/auth/login">로그인</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
