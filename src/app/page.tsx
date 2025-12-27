'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import AnimatedCharacter from '@/components/AnimatedCharacter';

export default function HomePage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('trending');
  const [isVisible, setIsVisible] = useState<{ [key: string]: boolean }>({});

  const observerRef = useRef<IntersectionObserver | null>(null);

  // 로그인 체크 - 로그인된 사용자는 자동 리다이렉트
  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // 사용자가 로그인되어 있으면 역할 확인 후 리다이렉트
        try {
          const token = await user.getIdToken();
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          const data = await response.json();
          
          if (data.success) {
            // 로그인된 사용자는 /feed로 리다이렉트
            router.push('/feed');
          } else {
            router.push('/feed');
          }
        } catch (error) {
          router.push('/feed');
        }
      }
    });

    return () => unsubscribe();
  }, [router]);

  // 스크롤 애니메이션
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
    { number: '누적', label: '누적 광고 매출' },
    { number: '활성 사용자 수', label: '활성 사용자' },
    { number: '고객만족도 %', label: '고객 만족도' },
  ];

  const steps = [
    { number: '01', title: '복잡한 기획서 X, 아이디어만 입력하세요', description: '단순한 아이디어를 매핑' },
    { number: '02', title: 'AI 기획서 생성', description: 'AI가 자동으로 실행 가능한 기획서를 만듭니다' },
    { number: '03', title: '자동 운영', description: '모집부터 리포트까지 플랫폼이 자동으로 처리합니다' },
  ];

  return (
    <div className="min-h-screen">
      {/* 움직이는 캐릭터 */}
      <AnimatedCharacter 
        size="lg"
        interactive={true}
        scrollBased={false}
      />
      
      {/* Hero Section - 풀스크린 이미지 */}
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
        
        {/* 오버레이 그라데이션 - 더 진하게 */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/60 z-10" />
        
        {/* 콘텐츠 */}
        <div className="relative z-20 max-w-7xl w-full text-center space-y-12 px-4 sm:px-6 lg:px-8 py-20">
          <div 
            id="hero-title"
            data-animate
            className={`transition-all duration-1000 ${
              isVisible['hero-title'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight leading-none text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
              다음 목적지는
              <br />
              <span className="text-white">AI 광고</span>
            </h1>
          </div>

          <div 
            id="hero-subtitle"
            data-animate
            className={`transition-all duration-1000 delay-300 ${
              isVisible['hero-subtitle'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <p className="text-2xl sm:text-3xl md:text-4xl text-white max-w-3xl mx-auto drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] font-medium">
              꿈을 실현하는 플랫폼. AI 광고 플랫폼에서 빠르게 구축하고 크게 성장하세요.
            </p>
          </div>

          <div 
            id="hero-cta"
            data-animate
            className={`transition-all duration-1000 delay-500 ${
              isVisible['hero-cta'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg px-8 py-6 bg-white text-primary hover:bg-white/90 shadow-2xl">
                <Link href="/signup">무료 체험 시작</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6 border-2 border-white text-white hover:bg-white/20 bg-white/10 backdrop-blur-sm shadow-2xl">
                <Link href="/login">로그인</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 통계 섹션 - 풀스크린 이미지 */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* 배경 이미지 - public/images/stats.jpg 에 이미지를 넣으세요 */}
        <div className="absolute inset-0 z-0">
          {/* 이미지를 넣으려면 아래 주석을 해제하고 이미지 경로를 수정하세요 */}
          {/* 
          <Image
            src="/images/stats.jpg"
            alt="Statistics"
            fill
            className="object-cover"
          />
          */}
          <div className="absolute inset-0 bg-gradient-to-br from-background/80 via-background/60 to-background/80" />
        </div>
        
        <div 
          id="stats"
          data-animate
          className={`relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 transition-all duration-1000 ${
            isVisible['stats'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-foreground">
            이제는 개인화 광고
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

      {/* 모든 것을 지원하는 플랫폼 섹션 - 풀스크린 이미지 */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* 배경 이미지 */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/platform.jpg"
            alt="Platform"
            fill
            className="object-cover"
            unoptimized
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div 
            id="platform-title"
            data-animate
            className={`text-center mb-16 transition-all duration-1000 ${
              isVisible['platform-title'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
              모든 것을 지원하는 단 하나의 광고 플랫폼
            </h2>
            <p className="text-xl text-white max-w-3xl mx-auto drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] font-medium">
              기획서 작성부터 자동 운영까지. 모든 채널에서 광고하세요. 
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
                className="aspect-square rounded-lg overflow-hidden bg-background/10 backdrop-blur-sm border border-white/20 hover:border-white/40 transition-all duration-300 cursor-pointer group"
              >
                {/* 각 카드 이미지 - public/images/gallery-{index+1}.jpg 에 이미지를 넣으세요 */}
                <div className="relative w-full h-full">
                  {/* 이미지를 넣으려면 아래 주석을 해제하고 이미지 경로를 수정하세요 */}
                  {/* 
                  <Image
                    src={`/images/gallery-${index + 1}.jpg`}
                    alt={`Gallery ${index + 1}`}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  */}
                  {/* 이미지가 없을 때 placeholder */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <div className="text-2xl font-bold text-white/60 group-hover:text-white transition-colors">
                        {index + 1}
                      </div>
                      <div className="text-sm text-white/40">캠페인 예시</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 성공 사례 섹션 - 풀스크린 이미지 */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* 배경 이미지 - public/images/success.jpg 에 이미지를 넣으세요 */}
        <div className="absolute inset-0 z-0">
          {/* 이미지를 넣으려면 아래 주석을 해제하고 이미지 경로를 수정하세요 */}
          {/* 
          <Image
            src="/images/success.jpg"
            alt="Success Stories"
            fill
            className="object-cover"
          />
          */}
          <div className="absolute inset-0 bg-black/60" />
        </div>
        
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid md:grid-cols-3 gap-8">
            <div 
              id="success-1"
              data-animate
              className={`p-8 rounded-lg bg-background/90 backdrop-blur-sm border border-white/20 transition-all duration-1000 ${
                isVisible['success-1'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
            >
              <h3 className="text-2xl font-bold mb-4">빠르게 시작하세요</h3>
              <p className="text-muted-foreground mb-4">
                개인 판매자도 아이디어 입력만으로 전문적인 광고 캠페인을 시작할 수 있습니다.
              </p>
              <div className="text-sm font-semibold text-primary">→ 시작하기</div>
            </div>

            <div 
              id="success-2"
              data-animate
              className={`p-8 rounded-lg bg-background/90 backdrop-blur-sm border border-white/20 transition-all duration-1000 delay-200 ${
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
              className={`p-8 rounded-lg bg-background/90 backdrop-blur-sm border border-white/20 transition-all duration-1000 delay-400 ${
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

      {/* 단계별 가이드 섹션 - 풀스크린 이미지 */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* 배경 이미지 - public/images/steps.jpg 에 이미지를 넣으세요 */}
        <div className="absolute inset-0 z-0">
          {/* 이미지를 넣으려면 아래 주석을 해제하고 이미지 경로를 수정하세요 */}
          {/* 
          <Image
            src="/images/steps.jpg"
            alt="Steps"
            fill
            className="object-cover"
          />
          */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/70 to-background/90" />
        </div>
        
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div 
            id="steps-title"
            data-animate
            className={`text-center mb-16 transition-all duration-1000 ${
              isVisible['steps-title'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
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

      {/* 최종 CTA 섹션 - 풀스크린 이미지 */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* 배경 이미지 */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/cta.jpg"
            alt="CTA"
            fill
            className="object-cover"
            unoptimized
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8 px-4 sm:px-6 lg:px-8 py-24">
          <h2 className="text-4xl md:text-5xl font-bold text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
            지금 시작해보세요
          </h2>
          <p className="text-xl text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] font-medium">
            간단한 회원가입으로 AI 광고 플랫폼을 이용하실 수 있습니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8 py-6 bg-white text-primary hover:bg-white/90 shadow-2xl">
              <Link href="/signup">무료로 시작하기</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6 border-2 border-white text-white hover:bg-white/20 bg-white/10 backdrop-blur-sm shadow-2xl">
              <Link href="/login">로그인</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

