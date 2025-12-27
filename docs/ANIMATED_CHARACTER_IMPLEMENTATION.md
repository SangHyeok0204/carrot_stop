# 움직이는 캐릭터 구현 가이드

## 개요

[littlesamo.io](https://littlesamo.io/)와 같은 움직이는 캐릭터를 랜딩 페이지에 추가하는 방법을 설명합니다.

---

## 구현 방법 비교

### 1. Lottie 애니메이션 (추천)
**장점:**
- After Effects에서 만든 복잡한 애니메이션 사용 가능
- 파일 크기가 작음 (JSON 형식)
- 부드러운 애니메이션
- 인터랙션 가능

**단점:**
- After Effects 파일 필요
- 디자이너 협업 필요

### 2. Framer Motion
**장점:**
- React와 완벽 통합
- 선언적 API
- 성능 최적화
- 코드로 애니메이션 제어

**단점:**
- 복잡한 캐릭터 애니메이션에는 제한적

### 3. GSAP (GreenSock)
**장점:**
- 매우 강력한 애니메이션 라이브러리
- 복잡한 애니메이션 가능
- 성능 우수

**단점:**
- 학습 곡선이 있음
- 상업적 사용 시 라이선스 필요할 수 있음

### 4. CSS 애니메이션
**장점:**
- 추가 라이브러리 불필요
- 가벼움

**단점:**
- 복잡한 애니메이션 구현 어려움

---

## 추천 구현 방법: Lottie + Framer Motion 조합

### 1단계: 필요한 패키지 설치

```bash
npm install lottie-react framer-motion
```

### 2단계: Lottie JSON 파일 준비

**옵션 A: LottieFiles에서 다운로드**
- [LottieFiles](https://lottiefiles.com/)에서 무료 애니메이션 다운로드
- JSON 파일을 `public/animations/` 폴더에 저장

**옵션 B: After Effects에서 제작**
- After Effects에서 애니메이션 제작
- Bodymovin 플러그인으로 JSON 내보내기

### 3단계: 컴포넌트 구현

```typescript
// src/components/AnimatedCharacter.tsx
'use client';

import { useEffect, useRef } from 'react';
import Lottie from 'lottie-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import animationData from '@/public/animations/character.json';

export default function AnimatedCharacter() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  // 스크롤에 따라 위치 변경
  const y = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1, 0]);

  return (
    <motion.div
      ref={containerRef}
      style={{ y, opacity }}
      className="fixed bottom-0 right-0 w-64 h-64 md:w-96 md:h-96 pointer-events-none z-10"
    >
      <Lottie
        animationData={animationData}
        loop={true}
        autoplay={true}
        style={{ width: '100%', height: '100%' }}
      />
    </motion.div>
  );
}
```

---

## 대안: CSS + SVG 애니메이션 (라이브러리 없이)

### 간단한 캐릭터 애니메이션 예시

```typescript
// src/components/SimpleAnimatedCharacter.tsx
'use client';

import { motion } from 'framer-motion';

export default function SimpleAnimatedCharacter() {
  return (
    <motion.div
      className="fixed bottom-10 right-10 w-32 h-32 md:w-48 md:h-48 z-10"
      animate={{
        y: [0, -20, 0],
        rotate: [0, 5, -5, 0],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <svg viewBox="0 0 200 200" className="w-full h-full">
        {/* 캐릭터 SVG */}
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
```

---

## 마우스 인터랙션 추가

```typescript
// src/components/InteractiveCharacter.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import Lottie from 'lottie-react';
import animationData from '@/public/animations/character.json';

export default function InteractiveCharacter() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const springX = useSpring(x, { stiffness: 100, damping: 30 });
  const springY = useSpring(y, { stiffness: 100, damping: 30 });

  useEffect(() => {
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
  }, [x, y]);

  return (
    <motion.div
      style={{
        x: springX,
        y: springY,
      }}
      className="fixed bottom-10 right-10 w-64 h-64 md:w-96 md:h-96 pointer-events-none z-10"
    >
      <Lottie
        animationData={animationData}
        loop={true}
        autoplay={true}
        style={{ width: '100%', height: '100%' }}
      />
    </motion.div>
  );
}
```

---

## 랜딩 페이지에 통합

```typescript
// src/app/page.tsx에 추가
import AnimatedCharacter from '@/components/AnimatedCharacter';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* 기존 Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* 움직이는 캐릭터 추가 */}
        <AnimatedCharacter />
        
        {/* 기존 콘텐츠 */}
        ...
      </section>
    </div>
  );
}
```

---

## 성능 최적화 팁

### 1. Lazy Loading
```typescript
import dynamic from 'next/dynamic';

const AnimatedCharacter = dynamic(
  () => import('@/components/AnimatedCharacter'),
  { ssr: false }
);
```

### 2. 애니메이션 제어
```typescript
// 뷰포트에 보일 때만 애니메이션 재생
const [isVisible, setIsVisible] = useState(false);

useEffect(() => {
  const observer = new IntersectionObserver(
    ([entry]) => setIsVisible(entry.isIntersecting),
    { threshold: 0.1 }
  );
  
  if (containerRef.current) {
    observer.observe(containerRef.current);
  }
  
  return () => observer.disconnect();
}, []);
```

### 3. 모바일 최적화
```typescript
// 모바일에서는 애니메이션 비활성화
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

{!isMobile && <AnimatedCharacter />}
```

---

## 무료 Lottie 애니메이션 리소스

1. **LottieFiles** (https://lottiefiles.com/)
   - 무료 애니메이션 다운로드
   - 다양한 스타일 제공

2. **IconScout** (https://iconscout.com/lottie-animations)
   - 고품질 Lottie 애니메이션

3. **Adobe After Effects 템플릿**
   - Envato Elements 등에서 구매 가능

---

## 구현 단계 요약

1. **패키지 설치**
   ```bash
   npm install lottie-react framer-motion
   ```

2. **애니메이션 파일 준비**
   - LottieFiles에서 다운로드 또는 제작
   - `public/animations/` 폴더에 저장

3. **컴포넌트 생성**
   - `src/components/AnimatedCharacter.tsx` 생성
   - Lottie 컴포넌트로 애니메이션 로드

4. **랜딩 페이지에 추가**
   - `src/app/page.tsx`에 컴포넌트 import 및 추가

5. **스타일링**
   - 위치, 크기 조정
   - 반응형 디자인 적용

---

## 참고 자료

- [Lottie React 문서](https://github.com/LottieFiles/lottie-react)
- [Framer Motion 문서](https://www.framer.com/motion/)
- [LottieFiles](https://lottiefiles.com/)
- [GSAP 문서](https://greensock.com/docs/)

---

**문서 버전**: 1.0  
**작성일**: 2024-12-27

