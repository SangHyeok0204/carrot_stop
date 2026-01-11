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
      <section className="relative min-h-screen flex items-center justify-center">
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
              <Button asChild size="lg" className="text-lg px-8 py-6 bg-sky-500 text-white hover:bg-sky-600 shadow-2xl">
                <Link href="/trial/start">무료 체험 시작</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6 border-2 border-sky-300 text-white hover:bg-sky-400/20 bg-sky-400/10 backdrop-blur-sm shadow-2xl">
                <Link href="/auth/login">로그인</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 추가 콘텐츠 섹션 - 스크롤 가능하도록 */}
      <section className="py-20 px-4 bg-gradient-to-b from-sky-50 via-white to-sky-50">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-sky-900">
            왜 I:EUM 인가요?
          </h2>
          <p className="text-sky-700 text-lg mb-12">
          브랜드와 고객을 잇는 새로운 방법
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="p-6 rounded-xl bg-gradient-to-br from-sky-50 to-cyan-50 border border-sky-200 hover:border-sky-400 hover:shadow-lg transition-all duration-300">
              <div className="w-16 h-16 bg-sky-500 rounded-2xl mb-4 mx-auto flex items-center justify-center">
                <div className="w-8 h-8 bg-white/30 rounded-lg" />
              </div>
              <h3 className="text-xl font-bold text-sky-900 mb-2">숏폼 광고 활성화</h3>
              <p className="text-sky-700">고 트렌드에 맞는 영상 제작 지원</p>
            </div>
            
            <div className="p-6 rounded-xl bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200 hover:border-cyan-400 hover:shadow-lg transition-all duration-300">
              <div className="w-16 h-16 bg-cyan-500 rounded-2xl mb-4 mx-auto flex items-center justify-center">
                <div className="w-8 h-8 bg-white/30 rounded-lg" />
              </div>
              <h3 className="text-xl font-bold text-cyan-900 mb-2">인플루언서와의 매칭</h3>
              <p className="text-cyan-700">인플루언서와의 협업을 위한 통합 툴 제공</p>
            </div>
            
            <div className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-200 hover:border-blue-400 hover:shadow-lg transition-all duration-300">
              <div className="w-16 h-16 bg-blue-500 rounded-2xl mb-4 mx-auto flex items-center justify-center">
                <div className="w-8 h-8 bg-white/30 rounded-lg" />
              </div>
              <h3 className="text-xl font-bold text-blue-900 mb-2">데이터 분석</h3>
              <p className="text-blue-700">캠페인 성과를 실시간으로 확인하세요</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-sky-600 via-cyan-600 to-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            지금 바로 시작하세요
          </h2>
          <p className="text-sky-100 text-lg mb-8">
            새로운 기회가 기다리고 있습니다
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8 py-6 bg-white text-sky-600 hover:bg-sky-50 shadow-lg">
              <Link href="/auth/signup">무료로 시작하기</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6 border-2 border-white text-white hover:bg-white/20 bg-white/10 backdrop-blur-sm">
              <Link href="/main">캠페인 둘러보기</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-sky-900 border-t border-sky-800">
        <div className="max-w-6xl mx-auto text-center text-sm text-sky-300">
          <p>© 2026 I:EUM. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
