'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useScroll, useTransform } from 'framer-motion';
import dynamic from 'next/dynamic';

// Lottie를 동적으로 로드 (SSR 방지)
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

interface AnimatedCharacterProps {
  animationData?: any; // Lottie JSON 데이터
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean; // 마우스 인터랙션 활성화
  scrollBased?: boolean; // 스크롤 기반 애니메이션
}

export default function AnimatedCharacter({
  animationData,
  className = '',
  size = 'md',
  interactive = true,
  scrollBased = false,
}: AnimatedCharacterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 마우스 인터랙션
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 100, damping: 30 });
  const springY = useSpring(y, { stiffness: 100, damping: 30 });

  // 스크롤 기반 애니메이션
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const scrollY = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const scrollOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1, 0]);

  // 모바일 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 뷰포트 감지
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // 마우스 인터랙션
  useEffect(() => {
    if (!interactive || isMobile) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;

      // 마우스 위치에 따라 캐릭터가 살짝 따라다니도록
      x.set((clientX - centerX) * 0.1);
      y.set((clientY - centerY) * 0.1);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [interactive, isMobile, x, y]);

  // 크기 설정
  const sizeClasses = {
    sm: 'w-32 h-32 md:w-40 md:h-40',
    md: 'w-48 h-48 md:w-64 md:h-64',
    lg: 'w-64 h-64 md:w-96 md:h-96',
  };

  // Lottie 애니메이션이 없으면 SVG 폴백 사용
  if (!animationData) {
    return (
      <motion.div
        ref={containerRef}
        className={`fixed bottom-10 right-10 ${sizeClasses[size]} ${className} pointer-events-none z-10`}
        style={
          scrollBased
            ? { y: scrollY, opacity: scrollOpacity }
            : interactive && !isMobile
            ? { x: springX, y: springY }
            : {}
        }
        animate={
          !scrollBased && !interactive
            ? {
                y: [0, -20, 0],
                rotate: [0, 5, -5, 0],
              }
            : {}
        }
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <svg viewBox="0 0 200 200" className="w-full h-full">
          {/* 간단한 캐릭터 SVG */}
          <motion.circle
            cx="100"
            cy="100"
            r="80"
            fill="#FFD700"
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          {/* 눈 */}
          <circle cx="80" cy="80" r="10" fill="#000" />
          <circle cx="120" cy="80" r="10" fill="#000" />
          {/* 입 */}
          <motion.path
            d="M 70 120 Q 100 140 130 120"
            stroke="#000"
            strokeWidth="3"
            fill="none"
            animate={{
              d: [
                'M 70 120 Q 100 140 130 120',
                'M 70 120 Q 100 150 130 120',
                'M 70 120 Q 100 140 130 120',
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </svg>
      </motion.div>
    );
  }

  // Lottie 애니메이션 사용
  return (
    <motion.div
      ref={containerRef}
      className={`fixed bottom-10 right-10 ${sizeClasses[size]} ${className} pointer-events-none z-10`}
      style={
        scrollBased
          ? { y: scrollY, opacity: scrollOpacity }
          : interactive && !isMobile
          ? { x: springX, y: springY }
          : {}
      }
    >
      {isVisible && (
        <Lottie
          animationData={animationData}
          loop={true}
          autoplay={true}
          style={{ width: '100%', height: '100%' }}
        />
      )}
    </motion.div>
  );
}

