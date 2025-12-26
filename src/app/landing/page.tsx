'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';

export default function LandingPage() {
  const [activeCategory, setActiveCategory] = useState('trending');
  const [isVisible, setIsVisible] = useState<{ [key: string]: boolean }>({});

  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({
              ...prev,
              [entry.target.id]: true,
            }));
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll('[data-animate]');
    elements.forEach((el) => observerRef.current?.observe(el));

    return () => {
      elements.forEach((el) => observerRef.current?.unobserve(el));
    };
  }, []);

  const categories = [
    { id: 'trending', label: '요즘 대세' },
    { id: 'popular', label: '인기 플랫폼' },
    { id: 'enterprise', label: '기업 솔루션' },
  ];

  const stats = [
    { number: '1조+', label: '누적 광고 매출' },
    { number: '10만+', label: '활성 사용자' },
    { number: '95%', label: '고객 만족도' },
  ];

  const steps = [
    { number: '01', title: '자연어로 요청', description: '광고 아이디어를 자연어로 입력하세요' },
    { number: '02', title: 'AI 기획서 생성', description: 'LLM이 자동으로 실행 가능한 기획서를 만듭니다' },
    { number: '03', title: '자동 운영', description: '모집부터 리포트까지 플랫폼이 자동으로 처리합니다' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section - Shopify 스타일 */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 bg-background overflow-hidden">
        <div className="max-w-7xl w-full text-center space-y-12 py-20">
          {/* 큰 타이포그래피 */}
          <div 
            id="hero-title"
            data-animate
            className={`transition-all duration-1000 ${
              isVisible['hero-title'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight leading-none">
              다음 목적지는
              <br />
              <span className="text-primary">AI 광고</span>
            </h1>
          </div>

          {/* 카테고리 네비게이션 */}
          <div 
            id="hero-categories"
            data-animate
            className={`transition-all duration-1000 delay-200 ${
              isVisible['hero-categories'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`px-6 py-3 rounded-full text-lg font-medium transition-all ${
                    activeCategory === category.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          {/* 서브타이틀 */}
          <div 
            id="hero-subtitle"
            data-animate
            className={`transition-all duration-1000 delay-300 ${
              isVisible['hero-subtitle'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <p className="text-2xl sm:text-3xl md:text-4xl text-muted-foreground max-w-3xl mx-auto">
              꿈을 실현하는 플랫폼. AI 광고 플랫폼에서 빠르게 구축하고 크게 성장하세요.
            </p>
          </div>

          {/* CTA 버튼 */}
          <div 
            id="hero-cta"
            data-animate
            className={`transition-all duration-1000 delay-500 ${
              isVisible['hero-cta'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg px-8 py-6">
                <Link href="/signup">무료 체험 시작</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6">
                <Link href="/login">로그인</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 통계 섹션 */}
      <section 
        id="stats"
        data-animate
        className={`py-20 px-4 sm:px-6 lg:px-8 bg-muted transition-all duration-1000 ${
          isVisible['stats'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            기업가와 기업 모두를 위한 플랫폼
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-5xl md:text-6xl font-bold text-primary mb-2">
                  {stat.number}
                </div>
                <div className="text-xl text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 모든 것을 지원하는 플랫폼 섹션 */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <div 
            id="platform-title"
            data-animate
            className={`text-center mb-16 transition-all duration-1000 ${
              isVisible['platform-title'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              모든 것을 지원하는 단 하나의 광고 플랫폼
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              자연어 입력부터 자동 운영까지. 모든 채널에서 광고하세요. 
              모든 규모의 비즈니스를 지원합니다.
            </p>
          </div>

          {/* 그리드 이미지 갤러리 */}
          <div 
            id="gallery"
            data-animate
            className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 transition-all duration-1000 delay-200 ${
              isVisible['gallery'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            {Array.from({ length: 12 }).map((_, index) => (
              <div
                key={index}
                className="aspect-square rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 hover:from-primary/30 hover:to-primary/10 transition-all duration-300 cursor-pointer group overflow-hidden"
              >
                <div className="w-full h-full flex items-center justify-center p-4">
                  <div className="text-center space-y-2">
                    <div className="text-2xl font-bold text-primary/60 group-hover:text-primary transition-colors">
                      {index + 1}
                    </div>
                    <div className="text-sm text-muted-foreground">캠페인 예시</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 성공 사례 섹션 */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-muted">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div 
              id="success-1"
              data-animate
              className={`p-8 rounded-lg bg-background border transition-all duration-1000 ${
                isVisible['success-1'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
            >
              <h3 className="text-2xl font-bold mb-4">빠르게 시작하세요</h3>
              <p className="text-muted-foreground mb-4">
                개인 판매자도 자연어 입력만으로 전문적인 광고 캠페인을 시작할 수 있습니다.
              </p>
              <div className="text-sm font-semibold text-primary">→ 시작하기</div>
            </div>

            <div 
              id="success-2"
              data-animate
              className={`p-8 rounded-lg bg-background border transition-all duration-1000 delay-200 ${
                isVisible['success-2'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
            >
              <h3 className="text-2xl font-bold mb-4">목표한 만큼 성장하세요</h3>
              <p className="text-muted-foreground mb-4">
                작은 비즈니스부터 글로벌 기업까지, 모든 규모의 성장을 지원합니다.
              </p>
              <div className="text-sm font-semibold text-primary">→ 성장하기</div>
            </div>

            <div 
              id="success-3"
              data-animate
              className={`p-8 rounded-lg bg-background border transition-all duration-1000 delay-400 ${
                isVisible['success-3'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
            >
              <h3 className="text-2xl font-bold mb-4">더 큰 꿈을 꾸세요</h3>
              <p className="text-muted-foreground mb-4">
                AI의 힘으로 광고 운영의 모든 단계를 자동화하고 비즈니스를 확장하세요.
              </p>
              <div className="text-sm font-semibold text-primary">→ 확장하기</div>
            </div>
          </div>
        </div>
      </section>

      {/* 단계별 가이드 섹션 */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-6xl mx-auto">
          <div 
            id="steps-title"
            data-animate
            className={`text-center mb-16 transition-all duration-1000 ${
              isVisible['steps-title'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              쉽게 시작하세요
            </h2>
            <p className="text-xl text-muted-foreground">
              세 가지 간단한 단계로 광고 캠페인을 시작하세요
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => {
              const delayClass = index === 0 ? '' : index === 1 ? 'delay-200' : 'delay-400';
              return (
                <div
                  key={index}
                  id={`step-${index}`}
                  data-animate
                  className={`text-center transition-all duration-1000 ${delayClass} ${
                    isVisible[`step-${index}`] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                  }`}
                >
                  <div className="text-6xl font-bold text-primary/20 mb-4">{step.number}</div>
                  <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <Button asChild size="lg" className="text-lg px-8 py-6">
              <Link href="/signup">시작하기</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 최종 CTA 섹션 */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-muted to-background">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold">
            지금 시작해보세요
          </h2>
          <p className="text-xl text-muted-foreground">
            간단한 회원가입으로 AI 광고 플랫폼을 이용하실 수 있습니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8 py-6">
              <Link href="/signup">무료로 시작하기</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6">
              <Link href="/login">로그인</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

