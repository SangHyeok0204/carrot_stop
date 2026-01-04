# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI 관리형 광고 운영 시스템 - A platform where advertisers describe campaigns in natural language, LLM generates campaign specs, and the platform manages influencer recruitment, execution, and reporting.

## Development Commands

```bash
npm run dev          # Start development server (uses --webpack flag)
npm run build        # Production build
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking (tsc --noEmit)
```

## Architecture

### Tech Stack
- **Frontend/Backend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication (email/password, Google)
- **Storage**: Firebase Storage
- **LLM**: OpenAI GPT-4 via `openai` package
- **Deployment**: Vercel with Cron Jobs

### Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin dashboard (/admin/*)
│   ├── advertiser/        # Advertiser pages (/advertiser/*)
│   ├── influencer/        # Influencer pages (/influencer/*)
│   ├── auth/              # Login/signup pages
│   └── api/               # API Routes
├── components/            # React components
│   ├── ui/               # Base UI components (button, card, input, etc.)
│   ├── main/             # Main page components
│   ├── shared/           # Shared components (CampaignCard, TopNav)
│   └── survey/           # Survey-related components
├── contexts/             # React Contexts (AuthContext, CampaignContext)
├── lib/                  # Core libraries
│   ├── firebase/         # Firebase client & admin SDK setup
│   ├── auth/             # Auth utilities (googleAuth, middleware, roles)
│   ├── llm/              # OpenAI integration (client, prompts, schema)
│   └── utils/            # Utilities (cn, constants)
└── types/                # TypeScript type definitions
```

### Key Data Flow

1. **Campaign Creation**: User input → `/api/campaigns/generate` → LLM generates spec → Stored in Firestore
2. **Authentication**: Firebase Auth (client) ↔ Firebase Admin SDK (server) for verification
3. **Role-based Access**: Three roles - `advertiser`, `influencer`, `admin` with role-specific routes

### Firebase Admin SDK

Server-side Firebase operations use Admin SDK (`src/lib/firebase/admin.ts`):
- `getAdminFirestore()` - Firestore instance
- `getAdminAuth()` - Auth instance
- `getAdminStorage()` - Storage instance

### LLM Integration

Campaign specs are generated via `generateCampaignSpec()` in `src/lib/llm/client.ts`:
- Uses GPT-4 with JSON response format
- Validates responses with Zod schema
- Includes retry logic (up to 2 retries)

### Cron Jobs (Vercel)

Defined in `vercel.json`:
- `/api/cron/deadline-reminder` - Daily 09:00 UTC
- `/api/cron/overdue-detection` - Daily 09:05 UTC
- `/api/cron/generate-reports` - Daily 18:00 UTC
- `/api/cron/status-transition` - Hourly

All cron endpoints require `CRON_SECRET` for authentication.

## Type System

### Campaign Status Flow
```
DRAFT → GENERATED → REVIEWED → CLARIFYING → APPROVED → OPEN → MATCHING → RUNNING → COMPLETED
                                                                                  ↘ FAILED/CANCELLED
```

### User Roles
- `advertiser`: Creates campaigns, reviews candidates
- `influencer`: Applies to campaigns, submits content
- `admin`: Platform management, monitoring

## Path Aliases

TypeScript paths configured in `tsconfig.json`:
- `@/*` → `./src/*`

## Environment Variables

Required (see `.env.local`):
- `NEXT_PUBLIC_FIREBASE_*` - Firebase client config
- `FIREBASE_ADMIN_*` - Firebase Admin SDK credentials
- `OPENAI_API_KEY` - OpenAI API key
- `CRON_SECRET` - Cron job authentication

## project explanation


## 초기 시장 전략 (Narrow Domain Strategy)

ads_platform은 초기 단계에서 **의도적으로 매우 좁고 유사한 도메인**에서 시작합니다.

### 초기 집중 도메인
- 한남동 카페거리
- 홍대 / 연남 카페 및 음식점
- 성수 카페
- 압구정 개인 바 / 소규모 다이닝
- 그 외 기타

### 도메인을 좁히는 이유
- 캠페인 성과의 변수를 최소화하기 위함
- **서로 비교 가능한 성공 사례를 빠르게 축적**하기 위함
- “나와 거의 같은 조건의 가게도 성공했다”는 설득을 가능하게 하기 위함
- 특히 **outdated 된 광고주 설득에는 레퍼런스가 가장 강력한 무기**이기 때문

도메인을 좁히는 것은 확장을 포기하는 것이 아니라,  
**초기 신뢰와 설득력을 확보하기 위한 전략적 선택**입니다.

---

## 광고주 유형 분류 (5 Types)

광고주는 하나의 집단이 아니라, 다음 5가지 유형으로 구분됩니다.

1. 인플루언서 홍보의 필요성 자체를 모르는 광고주
2. 필요성은 알지만 트렌드를 못 따라오거나 의심하는 광고주
3. 필요성은 알지만 시간/리소스 부족으로 실행하지 못하는 광고주
4. 이미 잘 하고 있지만 추가 성장과 외부 감각을 원하는 광고주
5. **검증된 인플루언서**를 체계적으로 찾고 싶은 광고주

### 초기 핵심 타깃
- 2번 ~ 5번 유형
- 1번 유형은 설득 비용이 매우 높아 초기 단계에서는 비우선

---

## 광고주 유형별 Pain Point

### 유형 2: 흐름을 못 따라오는 광고주
- “요즘 인스타가 어떻게 돌아가는지 모르겠다”
- “지금 하는 홍보가 맞는지 확신이 없다”
- 기존 홍보 방식이 outdated 된 것 같다는 불안

### 유형 3: 시간/리소스 부족 광고주
- 해야 하는 건 알지만 손댈 시간이 없다
- 인플루언서 협업을 관리할 여력이 없다
- 광고 운영이 본업에 부담이 된다

### 유형 4: 성장 지향 광고주
- 지금도 잘 되지만 한 단계 더 성장하고 싶다
- 트렌드, 외부 감각, 새로운 아이디어가 필요하다
- 내부 아이디어가 포화 상태다

### 유형 5: 리스크 회피형 광고주
- 검증된 인플루언서를 찾고 싶다
- 검증에 드는 시간과 비용이 너무 크다
- 실패 가능성을 최소화하고 싶다

---

## 핵심 MVP 방향 (매우 중요)

### 정의 전환
MVP는 단순한 “광고 캠페인 생성”이 아닙니다.

ads_platform의 핵심 제품은 다음과 같습니다.

**도장만 찍으면 바로 실행되는  
인스타그램 / 인플루언서 홍보 운영 플랜**

### 의미
- 광고주는 선택지 중 고르는 사람이 아님
- 광고주는 **승인자(Approve)** 역할
- 시스템은 여러 안이 아니라 **하나의 권장안**을 제시

### 운영 플랜에 반드시 포함될 요소
- 이번 홍보의 핵심 목표 요약
- 인스타 운영 전략 (포맷, 빈도, 톤)
- 인플루언서 협업 구조
- 성공 / 실패 가능 시나리오
- 성과가 낮을 경우의 조정 방향

---

## 레퍼런스 중심 설득 전략

outdated 되었거나 의심이 많은 광고주에게는  
설명보다 **사례(레퍼런스)**가 훨씬 강력합니다.

### 설득 원칙
- 항상 다음 조건이 유사한 사례를 우선 노출
  - 지역
  - 업종
  - 규모
- 가능한 경우 정량 지표 사용
- “당신과 거의 같은 조건에서 성공했다”는 메시지 강조

이 전략이 바로 **narrow domain 전략의 핵심 이유**입니다.

---

## 비즈니스 전략에서 도출된 UX 원칙

### 승인 중심 UX
- 핵심 CTA는 “생성”이 아님
- 핵심 CTA는
  - 승인
  - 수정 요청
  - 보류

### 통제감과 투명성
- 광고주는 항상 다음을 알아야 함
  - 현재 캠페인 단계
  - 다음 액션이 필요한지 여부
- 타임라인 기반 상태 UI는 필수

### 기능보다 신뢰
- 옵션은 적을수록 좋음
- 추천은 명확해야 함
- 이유는 반드시 설명되어야 함

---

## 기능 제안 시 고려 원칙 (비기술)

Claude는 기능 제안 또는 코드 리뷰 시 다음을 우선 고려해야 합니다.

1. 운영 플랜 승인 UI
2. 도메인 특화 레퍼런스 UI
3. 광고주 유형 기반 온보딩
4. 캠페인 진행 상태 타임라인
5. 인플루언서 신뢰 지표 (성공률, 재참여율, 승인률)

광고주 의사결정을 줄이지 않는  
일반적인 마켓플레이스형 기능 제안은 지양합니다.

---

## 제품 철학 한 문장

ads_platform은  
**자신과 거의 동일한 조건의 가게에서 이미 검증된  
인스타그램 및 인플루언서 홍보 패턴을  
그대로 가져다 쓸 수 있게 해주는 플랫폼**입니다.

