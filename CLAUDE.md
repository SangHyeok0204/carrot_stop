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

ads_platform 프로젝트 계획서
1. 프로젝트 한 줄 요약

ads_platform은 광고 기획부터 모집·운영·관리까지를 AI와 상태 기반 로직으로 통합한 광고 운영 플랫폼입니다.

2. 프로젝트 배경과 문제의식

현재 광고 운영은 기획, 캠페인 관리, 인플루언서 매칭, 성과 확인이 서로 다른 툴과 수작업에 의존해 파편화되어 있습니다.
이로 인해 광고주는 운영 부담이 크고, 인플루언서는 캠페인 탐색과 관리에 비효율이 발생합니다.

ads_platform은 이 과정을 하나의 플랫폼 안에서 자동화·연결·단순화하는 것을 목표로 합니다.

3. 해결하고자 하는 핵심 가치

광고 기획과 운영을 AI로 보조하여 진입 장벽을 낮춤

광고주–인플루언서 간 캠페인 정보를 단일 구조로 통합

캠페인 상태 중심 설계로 운영 흐름을 명확히 함

모든 페이지에서 동일한 데이터가 연동되는 구조 지향

4. 플랫폼 구조 개요

플랫폼은 광고주 / 인플루언서 / 공통 영역으로 구성됩니다.

광고주는 캠페인을 생성하고, 지원자를 관리하며, 진행 상태와 결과를 확인합니다.
인플루언서는 캠페인을 탐색하고 지원하며, 개인 마이페이지에서 진행 현황을 관리합니다.
메인 페이지는 플랫폼의 허브 역할을 하며, 모든 캠페인 정보가 집약됩니다.

5. 캠페인 라이프사이클

캠페인은 다음과 같은 상태 흐름을 가집니다.

Draft
→ Generating (AI 생성 중)
→ Generated (검토 대기)
→ Open (모집 중)
→ In Progress (진행 중)
→ Completed / Cancelled

모든 화면은 이 상태값을 기준으로 렌더링됩니다.

6. 데이터 연동 원칙

캠페인은 단일 데이터 소스를 기준으로 관리됩니다.

캠페인 생성 시 메인 피드와 광고주 마이페이지에 동시에 반영됩니다.

페이지는 데이터를 “소유”하지 않고 “조회”만 합니다.

상태 변경은 전 페이지에 즉시 반영되는 구조를 전제로 합니다.

7. UI/UX 기본 원칙

메인 컬러는 보라 계열 + 화이트

메인 페이지, 광고주 마이페이지, 인플루언서 마이페이지는 동일한 디자인 언어 사용

좌측 상단 ads platform 클릭 시 항상 메인 페이지로 이동

역할(광고주/인플루언서)에 따라 동일 캠페인이라도 가능한 액션은 다르게 노출

8. 기술 구조 (MVP 기준)

Frontend: Next.js (App Router), Client/Server Component 분리

Backend: API Route 기반 캠페인 관리

Auth: Firebase Authentication

로직 설계: status-driven 구조

AI: 캠페인 초안 자동 생성 (추후 추천/최적화로 확장)

9. 현재 개발 상태

페이지 구조 및 라우팅 설계 완료

캠페인 상태 모델 정의 완료

광고주 피드 기본 구현 완료

랜딩 페이지 정리 및 UX 개선 진행 중

10. 단기 로드맵

MVP: 캠페인 생성 → 모집 → 진행 → 완료의 전체 흐름 완성

AI 생성 품질 고도화

인플루언서 매칭 로직 확장

성과 요약 및 자동 운영 기능 추가

11. 핵심 요약 문장

ads_platform은 광고 운영 전 과정을 상태 기반 + AI 기반으로 단일화한 마켓플레이스형 SaaS입니다.
