'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';

// ============================================
// Scroll Animation Hook (Communique 스타일)
// ============================================

function useScrollAnimation() {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -100px 0px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return { ref, isVisible };
}

// ============================================
// Feature Card Component (둥근 사각형 버블 스타일)
// ============================================

interface FeatureCardProps {
  title: string;
  description: string;
  delay?: number;
}

function FeatureCard({ title, description, delay = 0 }: FeatureCardProps) {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <div
      ref={ref}
      className={`
        p-6 rounded-2xl
        bg-purple-50/50 border-2 border-purple-200
        hover:border-purple-400 hover:shadow-lg
        transition-all duration-500
        ${isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-8'
        }
      `}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <h3 className="text-xl font-bold text-purple-900 mb-3">{title}</h3>
      <p className="text-purple-700 leading-relaxed">{description}</p>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export default function HomePage() {
  const [isHeroVisible, setIsHeroVisible] = useState(false);

  useEffect(() => {
    setIsHeroVisible(true);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section - 원래 이미지 복구 */}
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
              isHeroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
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
              isHeroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <p className="text-2xl sm:text-3xl md:text-4xl text-white max-w-3xl mx-auto drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] font-medium">
              인플루언서 협업부터 브랜딩까지, 연결의 시작
            </p>
          </div>

          <div
            className={`transition-all duration-1000 delay-500 ${
              isHeroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
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

      {/* Features Section - 스크롤 애니메이션 */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="space-y-6">
            <FeatureCard
              title="캠페인 별 KPI 맞춤형 매체 운영 전략 및 솔루션 제공"
              description="각 캠페인의 목표에 맞는 맞춤형 전략을 제공합니다."
              delay={0}
            />
            <FeatureCard
              title="GA, 에이스카운터 등 여러 트래킹 툴 기반의 Data Driven"
              description="다양한 분석 도구를 활용한 데이터 기반 의사결정을 지원합니다."
              delay={100}
            />
            <FeatureCard
              title="DMP 플랫폼을 활용한 정교한 타겟팅"
              description="고도화된 데이터 관리 플랫폼으로 정확한 타겟팅을 실현합니다."
              delay={200}
            />
            <FeatureCard
              title="Data 기반의 광고 소재 기획 및 제작"
              description="데이터 분석 결과를 바탕으로 효과적인 광고 소재를 기획합니다."
              delay={300}
            />
            <FeatureCard
              title="ROAS 기반의 퍼포먼스 극대화"
              description="투자 대비 수익률을 최적화하여 성과를 극대화합니다."
              delay={400}
            />
            <FeatureCard
              title="다양한 트래킹 툴 Data 바탕으로 랜딩 페이지 최적화 제안"
              description="트래킹 데이터를 분석하여 랜딩 페이지를 지속적으로 개선합니다."
              delay={500}
            />
          </div>
        </div>
      </section>

      {/* CTA Section - 간결한 디자인 */}
      <section className="py-20 px-4 bg-gradient-to-b from-purple-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-purple-900 mb-6">
            지금 바로 시작하세요
          </h2>
          <p className="text-purple-700 text-lg mb-8">
            광고주든 인플루언서든, 새로운 기회가 기다리고 있습니다
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8 py-6 bg-green-600 text-white hover:bg-green-700 shadow-lg">
              <Link href="/auth/signup">무료로 시작하기</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6 border-2 border-purple-300 text-purple-700 hover:bg-purple-50">
              <Link href="/main">캠페인 둘러보기</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-purple-900 border-t border-purple-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-purple-300">© 2026 I:EUM. All rights reserved.</p>
            <a
              href="https://www.instagram.com/brand_ieum/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-purple-300 hover:text-white transition-colors"
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
  );
}
