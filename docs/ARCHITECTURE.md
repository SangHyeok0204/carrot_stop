# AI 관리형 광고 운영 시스템 - 아키텍처 설계

## 1. 전체 아키텍처 다이어그램 (텍스트)

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (Next.js Frontend)                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Advertiser  │  │  Influencer  │  │    Admin     │      │
│  │     UI       │  │     UI       │  │     UI       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/API Calls
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Next.js API Routes (Route Handlers)             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Auth Middleware → Role-based Access Control         │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Campaign │  │Application│ │Submission│  │  Admin   │   │
│  │   API    │  │    API    │ │   API    │  │   API    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   Firestore  │   │   Firebase   │   │  LLM API     │
│   (Database) │   │  Storage     │   │ (OpenAI etc) │
└──────────────┘   └──────────────┘   └──────────────┘
        │                   │
        │                   │
        └───────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │  Firebase Auth       │
        │  (Email/Google)      │
        └──────────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │  Background Jobs     │
        │  (Vercel Cron /      │
        │   Cloud Functions)   │
        └──────────────────────┘
```

## 2. 책임 분리 (Layered Architecture)

### Frontend Layer (Next.js App Router)
- **Pages**: 사용자 인터페이스 렌더링
- **Components**: 재사용 가능한 UI 컴포넌트
- **Client-side State**: React hooks, Context API
- **Route Protection**: Middleware로 역할 기반 접근 제어

### API Layer (Next.js Route Handlers)
- **Authentication**: Firebase Auth 토큰 검증
- **Authorization**: 역할 기반 권한 체크
- **Business Logic**: 캠페인 생성, 상태 관리, 검증
- **Data Transformation**: Firestore ↔ API 응답 변환

### Data Layer (Firebase Services)
- **Firestore**: 구조화된 데이터 저장 (campaigns, users, applications, submissions)
- **Firebase Storage**: 증빙 파일 업로드
- **Firebase Auth**: 사용자 인증 및 역할 관리

### External Services
- **LLM API**: 자연어 → campaign_spec 변환
- **Background Jobs**: 스케줄링된 작업 (리마인더, 리포트 생성)

## 3. 데이터 흐름

### 캠페인 생성 플로우
1. 광고주 → 자연어 입력 → `/api/campaigns/generate` (POST)
2. API → LLM 호출 → proposal + spec 생성
3. API → Firestore 저장 (campaigns/{id}/specs/{version})
4. API → 응답 반환 (proposal, spec, clarification_questions)
5. Frontend → 문서 형태로 표시

### 캠페인 승인 플로우
1. 광고주 → clarification_questions 답변 → `/api/campaigns/{id}/clarify` (POST)
2. 광고주 → 승인 → `/api/campaigns/{id}/approve` (POST)
3. API → campaign.status = "APPROVED" → "OPEN"으로 전환
4. Firestore → 실시간 업데이트 → Frontend 반영

### 인플루언서 지원 플로우
1. 인플루언서 → 캠페인 리스트 조회 → `/api/campaigns/open` (GET)
2. 인플루언서 → 지원 → `/api/campaigns/{id}/apply` (POST)
3. API → applications/{id} 생성
4. 광고주 → 지원자 목록 조회 → `/api/campaigns/{id}/applications` (GET)
5. 광고주 → 선정 → `/api/campaigns/{id}/applications/{appId}/select` (POST)

### 제출 및 리포트 플로우
1. 인플루언서 → 증빙 제출 → `/api/campaigns/{id}/submissions` (POST)
2. API → Storage에 파일 업로드, submissions/{id} 생성
3. 운영자 → 제출 검토 → `/api/campaigns/{id}/submissions/{subId}/review` (POST)
4. Background Job → 캠페인 종료 시 리포트 자동 생성

## 4. 보안 설계

- **Authentication**: Firebase Auth (서버 사이드 토큰 검증 필수)
- **Authorization**: 역할 기반 접근 제어 (middleware + Firestore Security Rules)
- **API Security**: 모든 API는 인증 토큰 필수, 역할별 권한 체크
- **Data Isolation**: 사용자는 자신의 데이터 또는 허가된 데이터만 접근
- **Audit Trail**: 모든 상태 변경은 events 컬렉션에 기록

## 5. 확장성 고려사항

- **Real-time Updates**: Firestore 실시간 리스너 활용
- **File Upload**: Firebase Storage 직접 업로드 (Signed URL 방식)
- **Background Jobs**: Vercel Cron (MVP) → Firebase Cloud Functions (확장)
- **Rate Limiting**: API 레벨에서 LLM 호출 제한
- **Caching**: 정적 데이터는 Next.js 캐싱 활용

