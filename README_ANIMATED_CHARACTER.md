# 움직이는 캐릭터 사용 가이드

## 빠른 시작

### 1. 기본 사용법

랜딩 페이지에 이미 추가되어 있습니다! 바로 확인할 수 있습니다.

```tsx
import AnimatedCharacter from '@/components/AnimatedCharacter';

<AnimatedCharacter 
  size="lg"
  interactive={true}
  scrollBased={false}
/>
```

### 2. Lottie 애니메이션 추가하기

#### Step 1: LottieFiles에서 애니메이션 다운로드
1. [LottieFiles](https://lottiefiles.com/) 접속
2. 원하는 애니메이션 검색 및 다운로드 (JSON 형식)
3. `public/animations/` 폴더에 저장

#### Step 2: 컴포넌트에 적용

```tsx
import animationData from '@/public/animations/your-animation.json';

<AnimatedCharacter 
  animationData={animationData}
  size="lg"
  interactive={true}
/>
```

### 3. Props 옵션

| Prop | Type | Default | 설명 |
|------|------|---------|------|
| `animationData` | `any` | `undefined` | Lottie JSON 데이터 (없으면 SVG 폴백 사용) |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 캐릭터 크기 |
| `interactive` | `boolean` | `true` | 마우스 인터랙션 활성화 |
| `scrollBased` | `boolean` | `false` | 스크롤 기반 애니메이션 |
| `className` | `string` | `''` | 추가 CSS 클래스 |

### 4. 예시

#### 기본 사용 (SVG 폴백)
```tsx
<AnimatedCharacter />
```

#### Lottie 애니메이션 사용
```tsx
import animationData from '@/public/animations/character.json';

<AnimatedCharacter 
  animationData={animationData}
  size="lg"
/>
```

#### 스크롤 기반 애니메이션
```tsx
<AnimatedCharacter 
  scrollBased={true}
  size="md"
/>
```

#### 마우스 인터랙션 비활성화
```tsx
<AnimatedCharacter 
  interactive={false}
  size="sm"
/>
```

## 무료 Lottie 애니메이션 리소스

1. **LottieFiles** - https://lottiefiles.com/
   - 가장 큰 무료 Lottie 애니메이션 라이브러리
   - 다양한 카테고리 제공

2. **IconScout** - https://iconscout.com/lottie-animations
   - 고품질 애니메이션

3. **Adobe After Effects 템플릿**
   - Envato Elements 등에서 구매 가능

## 커스터마이징

### SVG 캐릭터 수정

`src/components/AnimatedCharacter.tsx` 파일에서 SVG 부분을 수정하면 됩니다.

### 애니메이션 속도 조정

Framer Motion의 `transition` 속성을 수정하세요:

```tsx
transition={{
  duration: 3, // 애니메이션 지속 시간
  repeat: Infinity,
  ease: 'easeInOut',
}}
```

## 성능 최적화

- 모바일에서는 자동으로 마우스 인터랙션이 비활성화됩니다
- 뷰포트에 보일 때만 애니메이션이 재생됩니다
- Lottie는 동적으로 로드되어 초기 번들 크기에 영향을 주지 않습니다

## 문제 해결

### 애니메이션이 보이지 않아요
- `public/animations/` 폴더에 파일이 있는지 확인
- 브라우저 콘솔에서 에러 확인
- Lottie JSON 파일이 올바른 형식인지 확인

### 성능이 느려요
- 모바일에서는 `interactive={false}` 설정
- 애니메이션 파일 크기 확인 (1MB 이하 권장)
- `scrollBased={true}` 사용 고려

## 더 자세한 정보

자세한 구현 방법은 `docs/ANIMATED_CHARACTER_IMPLEMENTATION.md`를 참고하세요.

