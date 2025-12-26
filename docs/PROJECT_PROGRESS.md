# 프로젝트 진행 과정 상세 기록

## 📋 목차

1. [프로젝트 개요](#프로젝트-개요)
2. [초기 설계 단계](#초기-설계-단계)
3. [구현 단계](#구현-단계)
4. [Firebase 설정 및 환경 구성](#firebase-설정-및-환경-구성)
5. [문제 해결 과정](#문제-해결-과정)
6. [Git 관리 및 배포 준비](#git-관리-및-배포-준비)
7. [현재 상태 및 다음 단계](#현재-상태-및-다음-단계)

---

## 프로젝트 개요

### 목표
**"광고를 정의할 수 없는 광고주가 자연어로 '느낌/상황'만 입력하면, LLM이 광고 기획서를 만들고, 그 기획서를 기반으로 인플루언서 모집/선정/집행/증빙/리포트까지 플랫폼이 책임지고 끝까지 운영해주는 AI 관리형 광고 운영 시스템"**

### 핵심 원칙
- ❌ 기존 인플루언서 마켓플레이스 복제 금지
- ❌ 광고주에게 KPI/예산/콘텐츠 타입 직접 입력 금지
- ❌ 광고주-인플루언서 간 직접 메시지/DM 기능 금지
- ✅ 자연어 입력 → AI 생성 → 최소 확인 질문 구조 유지

### 사용자 역할 (RBAC)
1. **Advertiser (광고주)**
   - 자연어로만 캠페인 요청 입력
   - AI 기획서 승인/거절
   - 인플루언서 후보 중 선택
   - 진행 상태/결과 리포트 확인

2. **Influencer (인플루언서)**
   - 캠페인 리스트/브리프 열람
   - 지원
   - 선정되면 집행 후 증빙 제출

3. **Admin (운영자)**
   - 전체 캠페인 모니터링
   - 마감/지연/실패 감지 및 조치
   - 페널티/대체 투입/분쟁/정산 상태 관리

### 기술 스택 (고정)
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Next.js Route Handlers + Firebase Admin SDK
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication (Email/Password + Google OAuth 옵션)
- **Storage**: Firebase Storage (증빙 스크린샷/파일 업로드)
- **AI**: OpenAI GPT-4 (서버에서만 호출)
- **Background Jobs**: Vercel Cron 또는 Firebase Cloud Scheduler + Cloud Functions

---

## 초기 설계 단계

### 1. 아키텍처 설계

전체 시스템을 4개 레이어로 분리:

```
┌─────────────────────────────────────────┐
│   Frontend Layer (Next.js App Router)  │
│   - Pages, Components, Client State    │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│   API Layer (Next.js Route Handlers)    │
│   - Auth Middleware, Role-based Access │
│   - Business Logic, Data Transformation│
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│   Data Layer (Firebase Services)       │
│   - Firestore, Storage, Auth            │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│   External Services                     │
│   - LLM API, Background Jobs            │
└─────────────────────────────────────────┘
```

**책임 분리:**
- Frontend: UI 렌더링, 클라이언트 상태 관리, 라우트 보호
- API: 인증/권한 체크, 비즈니스 로직, 데이터 변환
- Data: 데이터 저장/조회, 파일 업로드, 사용자 인증
- External: AI 호출, 스케줄링된 작업

### 2. 폴더 구조 설계

Next.js App Router 기반 구조:

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 인증 페이지 (Route Group)
│   ├── (advertiser)/      # 광고주 전용 (Route Group)
│   ├── (influencer)/      # 인플루언서 전용 (Route Group)
│   ├── (admin)/           # 운영자 전용 (Route Group)
│   └── api/               # API Routes
├── components/            # React 컴포넌트
│   ├── ui/               # shadcn/ui 컴포넌트
│   ├── layout/          # 레이아웃 컴포넌트
│   ├── campaign/        # 캠페인 관련 컴포넌트
│   ├── influencer/      # 인플루언서 관련 컴포넌트
│   └── admin/           # 운영자 관련 컴포넌트
├── lib/                  # 공통 라이브러리
│   ├── firebase/        # Firebase 설정
│   ├── auth/            # 인증/권한
│   ├── llm/             # LLM 통합
│   └── utils/           # 유틸리티
└── types/               # TypeScript 타입 정의
```

**Route Groups 사용 이유:**
- 역할별 레이아웃 분리 (각 그룹에 `layout.tsx` 별도)
- URL 경로에 영향 없이 구조화 (괄호는 URL에 포함되지 않음)
- 미들웨어에서 역할 기반 접근 제어 용이

### 3. 데이터 모델 설계 (Firestore)

#### 컬렉션 구조

```
users/{uid}
├── role: "advertiser" | "influencer" | "admin"
├── profile fields (minimal)
└── createdAt

campaigns/{campaignId}
├── advertiserId
├── status: "DRAFT"|"GENERATED"|"REVIEWED"|"APPROVED"|"OPEN"|"MATCHING"|"RUNNING"|"COMPLETED"|"FAILED"|"CANCELLED"
├── title (from AI)
├── createdAt, updatedAt
├── approvedAt, openedAt, completedAt
└── subcollections:
    ├── specs/{specVersionId}
    │   ├── proposalMarkdown
    │   ├── specJson (validated campaign_spec)
    │   ├── version
    │   └── createdAt
    ├── applications/{applicationId}
    │   ├── influencerId
    │   ├── message (optional)
    │   ├── status: "APPLIED"|"REJECTED"|"SELECTED"
    │   └── createdAt
    ├── submissions/{submissionId}
    │   ├── influencerId
    │   ├── postUrl
    │   ├── screenshotUrls[]
    │   ├── metrics (views/likes/comments)
    │   ├── status: "SUBMITTED"|"NEEDS_FIX"|"APPROVED"
    │   └── createdAt, updatedAt
    └── reports/{reportId}
        ├── summary
        ├── kpiResults
        └── generatedAt

events/{eventId}
├── campaignId
├── actorId (user or system)
├── actorRole
├── type
├── payload
└── createdAt

penalties/{penaltyId}
├── campaignId
├── influencerId
├── reason
├── amountOrFlag
└── createdAt
```

**설계 원칙:**
- 상태 변경은 `events` 컬렉션에 감사 로그 기록
- 역할 기반 Security Rules로 접근 제어
- 서브컬렉션으로 관련 데이터 그룹화

### 4. API 명세 설계

#### 인증 API
- `POST /api/auth/signup` - 회원가입
- `GET /api/auth/me` - 현재 사용자 정보 조회

#### 캠페인 API
- `POST /api/campaigns/generate` - LLM으로 캠페인 생성
- `GET /api/campaigns` - 캠페인 리스트 조회
- `POST /api/campaigns` - 캠페인 생성
- `GET /api/campaigns/[id]` - 캠페인 상세 조회
- `POST /api/campaigns/[id]/approve` - 캠페인 승인
- `POST /api/campaigns/[id]/open` - 캠페인 오픈

#### 지원/제출 API
- `POST /api/campaigns/[id]/applications` - 인플루언서 지원
- `POST /api/campaigns/[id]/applications/[appId]/select` - 인플루언서 선정
- `POST /api/campaigns/[id]/submissions` - 증빙 제출
- `POST /api/campaigns/[id]/submissions/[subId]/review` - 제출 검토

#### 파일 업로드 API
- `POST /api/storage/upload` - 파일 업로드 (Firebase Storage)

#### Cron Jobs API
- `GET /api/cron/deadline-reminder` - 마감 리마인더
- `GET /api/cron/overdue-detection` - 지연 감지
- `GET /api/cron/generate-reports` - 리포트 생성
- `GET /api/cron/status-transition` - 상태 자동 전환

**인증 방식:**
- 모든 API는 Firebase Auth ID Token 필요
- `Authorization: Bearer <token>` 헤더로 전달
- 미들웨어에서 역할 기반 권한 체크

### 5. LLM 프롬프트 설계

#### 출력 형식
LLM은 반드시 2가지 출력을 생성:
1. **campaign_proposal** (Markdown 문서) - 사람이 읽는 광고 기획서
2. **campaign_spec** (JSON) - 실행용 구조화된 데이터

#### campaign_spec JSON 스키마 (Zod 검증)
```typescript
{
  objective: string;
  target_audience: { demographics, interests, behaviors };
  tone_and_mood: string[];
  recommended_content_types: Array<{ platform, format }>;
  schedule: { estimated_duration, milestones };
  budget_range: { min, max, currency, rationale };
  kpis: {
    guaranteed: string[];
    target: string[];
    reference: string[];
  };
  constraints: {
    must_have: string[];
    must_not: string[];
  };
  risk_flags: string[];
  clarification_questions: Array<{
    question: string;
    options: string[];
  }>; // 최대 3개
}
```

#### 재시도 전략
- JSON Schema 검증 실패 시 최대 2회 재시도
- 재시도 시 이전 오류 메시지를 프롬프트에 포함

### 6. Background Jobs 설계

#### Vercel Cron Jobs (vercel.json)
```json
{
  "crons": [
    {
      "path": "/api/cron/deadline-reminder",
      "schedule": "0 9 * * *"  // 매일 오전 9시 (UTC)
    },
    {
      "path": "/api/cron/overdue-detection",
      "schedule": "5 9 * * *"  // 매일 오전 9시 5분 (UTC)
    },
    {
      "path": "/api/cron/generate-reports",
      "schedule": "0 18 * * *"  // 매일 오후 6시 (UTC)
    },
    {
      "path": "/api/cron/status-transition",
      "schedule": "0 * * * *"  // 매시간
    }
  ]
}
```

**작업 내용:**
- **deadline-reminder**: 마감 D-1 이메일 발송
- **overdue-detection**: 마감 초과 감지 → 상태 변경/페널티 이벤트 기록
- **generate-reports**: 완료된 캠페인 리포트 자동 생성
- **status-transition**: 조건에 따라 상태 자동 전환 (예: OPEN → MATCHING)

---

## 구현 단계

### 1. 프로젝트 초기화

#### package.json 생성
```json
{
  "dependencies": {
    "next": "^14.2.35",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "typescript": "^5.5.4",
    "firebase": "^11.0.1",
    "firebase-admin": "^13.0.1",
    "zod": "^3.23.8",
    "openai": "^4.47.1",
    "@opentelemetry/api": "^1.9.0"
  }
}
```

#### 설정 파일 생성
- `tsconfig.json` - TypeScript 설정
- `next.config.js` - Next.js 설정
- `tailwind.config.ts` - Tailwind CSS 설정
- `postcss.config.js` - PostCSS 설정
- `.gitignore` - Git 제외 파일 목록

### 2. 타입 정의 구현

#### `src/types/user.ts`
```typescript
export type UserRole = 'advertiser' | 'influencer' | 'admin';

export interface User {
  uid: string;
  email: string;
  role: UserRole;
  displayName?: string;
  createdAt: Date;
}

export interface UserDocument {
  email: string;
  role: UserRole;
  displayName?: string;
  createdAt: FirebaseFirestore.Timestamp;
}
```

#### `src/types/campaign.ts`
캠페인 상태, 스펙 버전, 문서 인터페이스 정의

#### `src/types/application.ts`
인플루언서 지원 상태 및 문서 인터페이스 정의

#### `src/types/submission.ts`
증빙 제출 상태 및 문서 인터페이스 정의

### 3. Firebase 라이브러리 구현

#### `src/lib/firebase/admin.ts`
- Firebase Admin SDK 초기화
- 서비스 계정 키로 인증
- Firestore 및 Storage 인스턴스 반환

#### `src/lib/firebase/auth.ts`
- Firebase 클라이언트 Auth 초기화
- 환경변수에서 설정 읽기

#### `src/lib/firebase/firestore.ts`
- Firestore CRUD 작업 함수들
- `createUser`, `getUser`, `createCampaign`, `getCampaign`, `createApplication`, `createSubmission` 등

### 4. 인증/권한 미들웨어 구현

#### `src/lib/auth/roles.ts`
- 역할 상수 정의
- 역할 검증 함수

#### `src/lib/auth/middleware.ts`
- Firebase Auth 토큰 검증
- 역할 기반 접근 제어
- API 라우트에서 사용하는 미들웨어 함수

### 5. LLM 통합 구현

#### `src/lib/llm/schema.ts`
- Zod 스키마로 `CampaignSpecSchema` 정의
- JSON 검증 및 타입 안전성 보장

#### `src/lib/llm/prompts.ts`
- System Prompt: LLM 역할 및 출력 형식 정의
- User Prompt Template: 자연어 입력을 받아 프롬프트 생성

#### `src/lib/llm/client.ts`
- OpenAI API 클라이언트
- JSON Schema 검증 및 재시도 로직
- `generateCampaign` 함수

### 6. API 라우트 구현

#### 인증 API
- `src/app/api/auth/signup/route.ts`
  - Firebase Admin으로 사용자 생성
  - Firestore에 사용자 문서 생성
  - 역할 설정 (advertiser/influencer)

- `src/app/api/auth/me/route.ts`
  - 현재 사용자 정보 조회
  - 토큰에서 UID 추출 후 Firestore 조회

#### 캠페인 API
- `src/app/api/campaigns/generate/route.ts`
  - 자연어 입력 받기
  - LLM 호출하여 campaign_spec 생성
  - Firestore에 저장 (DRAFT → GENERATED)

- `src/app/api/campaigns/route.ts`
  - GET: 캠페인 리스트 조회 (역할별 필터링)
  - POST: 캠페인 생성

- `src/app/api/campaigns/[id]/route.ts`
  - GET: 캠페인 상세 조회

- `src/app/api/campaigns/[id]/approve/route.ts`
  - 캠페인 승인 (GENERATED → REVIEWED → APPROVED)

- `src/app/api/campaigns/[id]/open/route.ts`
  - 캠페인 오픈 (APPROVED → OPEN)

#### 지원/제출 API
- `src/app/api/campaigns/[id]/applications/route.ts`
  - POST: 인플루언서 지원

- `src/app/api/campaigns/[id]/applications/[appId]/select/route.ts`
  - POST: 인플루언서 선정 (OPEN → MATCHING)

- `src/app/api/campaigns/[id]/submissions/route.ts`
  - POST: 증빙 제출

- `src/app/api/campaigns/[id]/submissions/[subId]/review/route.ts`
  - POST: 제출 검토 (SUBMITTED → NEEDS_FIX / APPROVED)

#### 파일 업로드 API
- `src/app/api/storage/upload/route.ts`
  - Firebase Storage에 파일 업로드
  - 업로드된 URL 반환

#### Cron Jobs API
- `src/app/api/cron/deadline-reminder/route.ts`
- `src/app/api/cron/overdue-detection/route.ts`
- `src/app/api/cron/generate-reports/route.ts`
- `src/app/api/cron/status-transition/route.ts`

모든 Cron API는 `CRON_SECRET` 헤더로 인증

### 7. UI 컴포넌트 구현

#### shadcn/ui 컴포넌트
- `src/components/ui/button.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/textarea.tsx`
- `src/components/ui/badge.tsx`

### 8. 페이지 구현

#### 인증 페이지
- `src/app/(auth)/login/page.tsx` - 로그인 페이지
- `src/app/(auth)/signup/page.tsx` - 회원가입 페이지

#### 광고주 페이지
- `src/app/(advertiser)/layout.tsx` - 광고주 레이아웃
- `src/app/(advertiser)/campaigns/page.tsx` - 캠페인 리스트
- `src/app/(advertiser)/campaigns/new/page.tsx` - 자연어 입력
- `src/app/(advertiser)/campaigns/[id]/review/page.tsx` - 기획서 검토
- `src/app/(advertiser)/campaigns/[id]/page.tsx` - 캠페인 상세

#### 인플루언서 페이지
- `src/app/(influencer)/layout.tsx` - 인플루언서 레이아웃
- `src/app/(influencer)/campaigns/page.tsx` - 캠페인 리스트
- `src/app/(influencer)/campaigns/[id]/page.tsx` - 캠페인 브리프

#### 운영자 페이지
- `src/app/(admin)/layout.tsx` - 운영자 레이아웃
- `src/app/(admin)/dashboard/page.tsx` - 대시보드
- `src/app/(admin)/campaigns/page.tsx` - 캠페인 모니터링
- `src/app/(admin)/campaigns/[id]/page.tsx` - 캠페인 상세

#### 루트 페이지
- `src/app/page.tsx` - 홈/랜딩 페이지 (로그인 상태에 따라 리다이렉트)

---

## Firebase 설정 및 환경 구성

### 1. Firebase 프로젝트 생성

1. Firebase Console 접속
2. 프로젝트 생성 (`nextcarrot-195ac`)
3. 웹 앱 등록
4. SDK 설정 값 복사 (환경변수에 사용)

### 2. Firebase 서비스 활성화

#### Authentication
- 이메일/비밀번호 인증 활성화
- Google OAuth (선택 사항)

#### Firestore Database
- 프로덕션 모드로 생성
- 위치: `asia-northeast3` (서울)
- 보안 규칙은 나중에 배포

#### Storage
- 프로덕션 모드로 생성
- Firestore와 동일한 리전
- 보안 규칙은 나중에 배포

### 3. 서비스 계정 키 생성

1. Firebase Console → 프로젝트 설정 → 서비스 계정
2. "새 비공개 키 생성" 클릭
3. JSON 파일 다운로드 (`nextcarrot-195ac-firebase-adminsdk-fbsvc-ec23e4d6da.json`)
4. JSON 파일에서 다음 값 추출:
   - `project_id` → `FIREBASE_ADMIN_PROJECT_ID`
   - `client_email` → `FIREBASE_ADMIN_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_ADMIN_PRIVATE_KEY` (전체 문자열, 따옴표 포함)

### 4. 환경변수 파일 생성

`.env.local` 파일 생성 및 설정:

```env
# Firebase Config (클라이언트용)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Firebase Admin (서버용)
FIREBASE_ADMIN_PROJECT_ID=...
FIREBASE_ADMIN_CLIENT_EMAIL=...
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=...

# OpenAI API
OPENAI_API_KEY=sk-...

# Cron Secret (백그라운드 작업 인증용)
CRON_SECRET=...

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**주의사항:**
- `.env.local`은 `.gitignore`에 포함되어 Git에 커밋되지 않음
- 서비스 계정 키 JSON 파일도 `.gitignore`에 추가 (`*-firebase-adminsdk-*.json`)

### 5. Firebase 보안 규칙 배포

#### Firebase CLI 설치 및 로그인
```bash
npm install -g firebase-tools
firebase login
```

#### Firestore 초기화
```bash
firebase init firestore
```

#### 보안 규칙 배포
```bash
# Firestore 규칙
firebase deploy --only firestore:rules

# Firestore 인덱스
firebase deploy --only firestore:indexes

# Storage 규칙
firebase deploy --only storage:rules
```

**보안 규칙 특징:**
- 역할 기반 접근 제어
- 광고주는 자신의 캠페인만 조회/수정 가능
- 인플루언서는 오픈된 캠페인만 조회 가능
- 운영자는 모든 캠페인 접근 가능

---

## 문제 해결 과정

### 1. TypeScript 컴파일 오류

#### 문제 1: `getAdminFirestore` export 누락
**에러:**
```
Module '"@/lib/firebase/firestore"' declares 'getAdminFirestore' locally, but it is not exported.
```

**해결:**
`src/lib/firebase/firestore.ts`에서 `getAdminFirestore` 함수를 명시적으로 export

#### 문제 2: `campaignId` 중복 정의
**에러:**
```
'campaignId' is specified more than once, so this usage will be overwritten.
```

**해결:**
`createApplication` 및 `createSubmission` 함수에서 spread 연산자 순서 조정:
```typescript
// Before
const data = { ...applicationData, campaignId };

// After
const data = { campaignId, ...applicationData };
```

#### 문제 3: Zod 스키마 타입 불일치
**에러:**
```
Type 'ZodObject<{...}>' is not assignable to type 'ZodType<CampaignSpec, ...>'
```

**해결:**
`BudgetRangeSchema`에서 `currency` 필드를 명시적으로 `z.string().default('KRW')`로 정의

### 2. 의존성 오류

#### 문제: `@opentelemetry/api` 모듈 누락
**에러:**
```
Cannot find module '@opentelemetry/api'
```

**원인:**
`@google-cloud/firestore`가 OpenTelemetry를 의존성으로 요구하지만 자동 설치되지 않음

**해결:**
```bash
npm install @opentelemetry/api
```

### 3. Next.js 라우트 충돌

#### 문제: 중복 라우트 경로
**에러:**
```
You cannot have two parallel pages that resolve to the same path.
Please check /(admin)/dashboard/page and /dashboard/page.
```

**원인:**
`src/app/dashboard/page.tsx`와 `src/app/(admin)/dashboard/page.tsx`가 동일한 경로(`/dashboard`)로 해석됨

**해결:**
1. `src/app/dashboard/page.tsx` 삭제
2. 인증 후 리다이렉트 로직 수정:
   - `src/app/(auth)/signup/page.tsx`: 역할에 따라 `/admin/dashboard` 또는 `/campaigns`로 리다이렉트
   - `src/app/(auth)/login/page.tsx`: 동일하게 수정
   - `src/app/page.tsx`: 로그인 상태 확인 후 역할별 리다이렉트

**리다이렉트 로직:**
```typescript
// API로 사용자 역할 조회
const userResponse = await fetch('/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${await auth.currentUser!.getIdToken()}`,
  },
});
const userData = await userResponse.json();

if (userData.data.role === 'admin') {
  router.push('/admin/dashboard');
} else {
  router.push('/campaigns');
}
```

### 4. Firebase Storage 설정 오류

#### 문제: Storage 미활성화
**에러:**
```
Firebase Storage has not been set up on project 'nextcarrot-195ac'.
```

**해결:**
1. Firebase Console → Storage → "시작하기" 클릭
2. 프로덕션 모드 선택
3. 위치 선택 (Firestore와 동일한 리전 권장)
4. 완료

**참고:**
- Storage는 증빙 파일 업로드에만 필요
- 초기 개발 단계에서는 선택 사항 (나중에 활성화 가능)

### 5. 회원가입 실패 문제

#### 문제: 회원가입 API 호출 실패
**원인:**
- 클라이언트에서 `createUserWithEmailAndPassword`를 먼저 호출
- 그 다음 API 라우트에서 다시 사용자 생성 시도
- 중복 생성 시도로 인한 오류

**해결:**
1. 클라이언트에서 `createUserWithEmailAndPassword` 제거
2. API 라우트(`/api/auth/signup`)에서만 사용자 생성:
   - Firebase Admin `createUser`로 Auth 사용자 생성
   - Firestore에 사용자 문서 생성
3. API 성공 후 클라이언트에서 `signInWithEmailAndPassword`로 로그인
4. 에러 메시지 사용자 친화적으로 개선

**수정된 플로우:**
```typescript
// signup/page.tsx
const response = await fetch('/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password, role }),
});

if (!response.ok) {
  const data = await response.json();
  throw new Error(data.error?.message || '회원가입에 실패했습니다.');
}

// 회원가입 성공 후 로그인
await signInWithEmailAndPassword(auth, email, password);
```

### 6. Git Push Protection 오류

#### 문제: GitHub Secret Scanning
**에러:**
```
Push cannot contain secrets
- OpenAI API Key in QUICK_START.md:64
```

**원인:**
`QUICK_START.md` 파일에 실제 OpenAI API 키가 포함됨

**해결:**
1. `QUICK_START.md`에서 실제 API 키 제거
2. 예시 형식으로 변경:
   ```markdown
   - 형식: `sk-...` 또는 `sk-proj-...`로 시작
   - 예시: `sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   ```
3. `.gitignore`에 Firebase 서비스 계정 키 패턴 추가:
   ```
   *-firebase-adminsdk-*.json
   ```
4. 커밋 수정 (`git commit --amend`)
5. 푸시 성공

---

## Git 관리 및 배포 준비

### 1. Git 저장소 초기화

```bash
git init
git remote add origin https://github.com/Jeonghyun-pp/ads_platform.git
```

### 2. .gitignore 설정

```
# Dependencies
/node_modules

# Next.js
/.next/
/out/

# Environment variables
.env*.local
.env

# Firebase
.firebase/
*-firebase-adminsdk-*.json
service-account-key.json

# Logs
*.log

# Misc
.DS_Store
```

### 3. 문서 정리

#### 이동된 문서 (docs/ 폴더로)
- `ARCHITECTURE.md` → `docs/ARCHITECTURE.md`
- `FOLDER_STRUCTURE.md` → `docs/FOLDER_STRUCTURE.md`
- `FIRESTORE_SCHEMA.md` → `docs/FIRESTORE_SCHEMA.md`
- `API_SPEC.md` → `docs/API_SPEC.md`
- `LLM_PROMPT_DESIGN.md` → `docs/LLM_PROMPT_DESIGN.md`
- `BACKGROUND_JOBS.md` → `docs/BACKGROUND_JOBS.md`

#### 삭제된 문서 (중복/불필요)
- `SETUP.md` (내용을 `QUICK_START.md`에 통합)
- `PROJECT_SUMMARY.md` (내용을 `README.md`에 통합)
- `GIT_GUIDE.md` (내용을 `QUICK_START.md`에 통합)
- 기타 중복 가이드 문서들

#### 생성된 문서
- `QUICK_START.md` - 빠른 시작 가이드 (통합)
- `DEPLOYMENT.md` - 배포 가이드
- `docs/PROJECT_PROGRESS.md` - 이 문서

### 4. 커밋 및 푸시

#### 주요 커밋
```bash
git add .
git commit -m "Fix: 인증 플로우 개선 및 라우트 충돌 해결

- 회원가입/로그인 후 역할 기반 리다이렉트 구현
- 중복 dashboard 라우트 제거
- 문서 정리 (docs 폴더로 이동)
- Firebase 서비스 계정 키 .gitignore 추가
- OpenTelemetry 의존성 추가
- QUICK_START.md에서 API 키 제거"

git push origin main
```

### 5. Firebase 설정 파일 커밋

- `.firebaserc` - Firebase 프로젝트 설정
- `firebase.json` - Firebase 배포 설정
- `firestore.rules` - Firestore 보안 규칙
- `firestore.indexes.json` - Firestore 인덱스
- `storage.rules` - Storage 보안 규칙

**주의:**
- 서비스 계정 키 JSON 파일은 커밋하지 않음
- 환경변수 파일도 커밋하지 않음

---

## 현재 상태 및 다음 단계

### 현재 완료된 작업

✅ **프로젝트 구조 및 아키텍처 설계**
- 폴더 구조 정의
- 데이터 모델 설계
- API 명세 작성
- LLM 프롬프트 설계

✅ **핵심 기능 구현**
- Firebase 설정 및 연결
- 인증/권한 시스템 (회원가입, 로그인, 역할 기반 접근 제어)
- 타입 정의 (User, Campaign, Application, Submission)
- Firebase 라이브러리 (Admin, Auth, Firestore)
- LLM 통합 (OpenAI API, Zod 검증, 재시도 로직)
- API 라우트 (인증, 캠페인, 지원/제출, 파일 업로드, Cron Jobs)
- 기본 UI 컴포넌트 (shadcn/ui)
- 페이지 구조 (인증, 광고주, 인플루언서, 운영자)

✅ **Firebase 설정**
- Authentication 활성화
- Firestore Database 생성
- Storage 활성화
- 보안 규칙 배포
- 서비스 계정 키 설정

✅ **환경 구성**
- 환경변수 파일 생성 및 설정
- `.gitignore` 설정
- Firebase CLI 설정

✅ **문제 해결**
- TypeScript 컴파일 오류 수정
- 의존성 오류 해결
- 라우트 충돌 해결
- 회원가입 플로우 개선
- Git Push Protection 이슈 해결

✅ **문서화**
- README.md 작성
- QUICK_START.md 작성
- DEPLOYMENT.md 작성
- 아키텍처 문서 작성
- API 명세서 작성
- 진행 과정 문서 작성 (이 문서)

### 다음 단계 (TODO)

#### 1. 기능 완성도 향상

**광고주 기능**
- [ ] 자연어 입력 페이지 UI 개선
- [ ] AI 기획서 검토 페이지 완성 (Markdown 렌더링)
- [ ] 확인 질문 답변 페이지 구현
- [ ] 인플루언서 후보 리스트 및 선정 기능
- [ ] 캠페인 상태별 필터링 및 검색

**인플루언서 기능**
- [ ] 캠페인 브리프 상세 페이지 완성
- [ ] 지원 기능 완성
- [ ] 증빙 제출 폼 완성 (파일 업로드, URL 입력, 수치 입력)
- [ ] 제출 상태 확인 페이지

**운영자 기능**
- [ ] 대시보드 통계 및 차트
- [ ] 지연/위험 캠페인 알림
- [ ] 페널티 적용 기능
- [ ] 대체 인플루언서 추천 기능
- [ ] 분쟁 처리 워크플로우

#### 2. UI/UX 개선

- [ ] 레이아웃 컴포넌트 (Navbar, Sidebar) 구현
- [ ] 상태 배지 및 진행 상황 표시
- [ ] 로딩 상태 및 에러 처리 개선
- [ ] 반응형 디자인 적용
- [ ] 다크 모드 지원 (선택 사항)

#### 3. 백그라운드 작업 구현

- [ ] 마감 리마인더 이메일 발송 기능
- [ ] 지연 감지 및 자동 상태 변경
- [ ] 리포트 자동 생성 (LLM 활용)
- [ ] 상태 자동 전환 로직 완성

#### 4. 테스트 및 검증

- [ ] 회원가입/로그인 플로우 테스트
- [ ] 캠페인 생성 플로우 테스트 (LLM API 호출)
- [ ] 인플루언서 지원/선정 플로우 테스트
- [ ] 증빙 제출/검토 플로우 테스트
- [ ] Firestore 보안 규칙 테스트
- [ ] Cron Jobs 테스트 (로컬 및 배포 환경)

#### 5. 배포 준비

- [ ] Vercel 프로젝트 생성 및 연결
- [ ] 환경변수 설정 (Vercel 대시보드)
- [ ] Cron Jobs 설정 확인
- [ ] 프로덕션 환경 테스트
- [ ] 성능 최적화
- [ ] 에러 모니터링 설정 (Sentry 등, 선택 사항)

#### 6. 추가 기능 (선택 사항)

- [ ] 이메일 알림 기능 (SendGrid, Resend 등)
- [ ] 파일 업로드 진행률 표시
- [ ] 이미지 미리보기 기능
- [ ] 캠페인 템플릿 기능
- [ ] 다국어 지원 (i18n)

### 현재 실행 가능한 상태

✅ **로컬 개발 환경**
```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

✅ **접속 가능한 페이지**
- `http://localhost:3000` - 홈/랜딩 페이지
- `http://localhost:3000/login` - 로그인
- `http://localhost:3000/signup` - 회원가입
- `http://localhost:3000/campaigns` - 캠페인 리스트 (로그인 필요)
- `http://localhost:3000/admin/dashboard` - 운영자 대시보드 (admin 역할 필요)

✅ **작동하는 기능**
- 회원가입 (advertiser/influencer 역할 선택)
- 로그인
- 역할 기반 리다이렉트
- Firebase 인증
- Firestore 데이터 저장/조회

### 주의사항

⚠️ **환경변수 필수**
- `.env.local` 파일이 없으면 실행 불가
- 모든 Firebase 및 OpenAI API 키가 설정되어 있어야 함

⚠️ **Firebase Storage**
- 증빙 파일 업로드 기능을 사용하려면 Storage 활성화 필요
- 초기 개발 단계에서는 선택 사항

⚠️ **OpenAI API 비용**
- LLM 호출 시 비용 발생
- 개발 중에는 사용량 모니터링 권장

---

## 결론

이 프로젝트는 **"자연어 입력 → AI 기획서 생성 → 플랫폼 자동 운영"**이라는 핵심 아이디어를 구현하기 위해 체계적으로 설계되고 구현되었습니다.

**주요 성과:**
1. ✅ 완전한 아키텍처 설계 및 문서화
2. ✅ Firebase 기반 백엔드 인프라 구축
3. ✅ 역할 기반 인증/권한 시스템 구현
4. ✅ LLM 통합 및 JSON 스키마 검증
5. ✅ 기본 UI 구조 및 페이지 구현
6. ✅ 문제 해결 및 안정화

**다음 단계:**
- 기능 완성도 향상 (UI 개선, 플로우 완성)
- 백그라운드 작업 구현
- 테스트 및 검증
- 배포 및 프로덕션 준비

프로젝트는 현재 **기본 인프라가 완성된 상태**이며, 추가 기능 개발을 진행할 수 있는 단계입니다.

---

**작성일:** 2025년 12월 25일  
**프로젝트:** AI 관리형 광고 운영 시스템  
**버전:** MVP (Minimum Viable Product) - Phase 1 완료

