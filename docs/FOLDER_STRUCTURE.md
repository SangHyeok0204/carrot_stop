# 프로젝트 폴더 구조

```
ads/
├── .env.local                    # 환경변수 (로컬)
├── .env.example                  # 환경변수 예시
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
├── firebase.json                 # Firebase 설정
├── firestore.rules              # Firestore 보안 규칙
├── firestore.indexes.json       # Firestore 인덱스
│
├── public/                      # 정적 파일
│   └── images/
│
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── layout.tsx           # 루트 레이아웃
│   │   ├── page.tsx             # 랜딩/홈 페이지
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── signup/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (advertiser)/        # 광고주 전용 라우트
│   │   │   ├── layout.tsx       # Advertiser 레이아웃 (네비게이션 포함)
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx     # 캠페인 대시보드
│   │   │   ├── campaigns/
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx # 자연어 입력
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── page.tsx # 캠페인 상세 (제안서, 후보자)
│   │   │   │   │   ├── review/
│   │   │   │   │   │   └── page.tsx # 제안서 검토
│   │   │   │   │   └── clarify/
│   │   │   │   │       └── page.tsx # 확인 질문 답변
│   │   │   │   └── page.tsx     # 캠페인 리스트
│   │   │   └── onboarding/
│   │   │       └── page.tsx     # 온보딩 가이드
│   │   │
│   │   ├── (influencer)/        # 인플루언서 전용 라우트
│   │   │   ├── layout.tsx       # Influencer 레이아웃
│   │   │   ├── campaigns/
│   │   │   │   ├── page.tsx     # 오픈 캠페인 리스트
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx # 캠페인 브리프 상세
│   │   │   │       └── submit/
│   │   │   │           └── page.tsx # 증빙 제출 폼
│   │   │   └── my-campaigns/
│   │   │       └── page.tsx     # 내 캠페인 (선정된 것들)
│   │   │
│   │   ├── (admin)/             # 운영자 전용 라우트
│   │   │   ├── layout.tsx       # Admin 레이아웃
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx     # 전체 캠페인 모니터링
│   │   │   ├── campaigns/
│   │   │   │   ├── page.tsx     # 캠페인 관리 리스트
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx # 캠페인 상세 관리
│   │   │   └── penalties/
│   │   │       └── page.tsx     # 페널티 관리
│   │   │
│   │   └── api/                 # API Route Handlers
│   │       ├── auth/
│   │       │   ├── login/route.ts
│   │       │   ├── signup/route.ts
│   │       │   └── me/route.ts  # 현재 사용자 정보
│   │       │
│   │       ├── campaigns/
│   │       │   ├── route.ts     # GET (리스트), POST (생성)
│   │       │   ├── [id]/
│   │       │   │   ├── route.ts # GET, PATCH (단일 캠페인)
│   │       │   │   ├── approve/route.ts
│   │       │   │   ├── clarify/route.ts
│   │       │   │   ├── open/route.ts
│   │       │   │   ├── applications/
│   │       │   │   │   ├── route.ts # GET, POST (지원)
│   │       │   │   │   └── [appId]/
│   │       │   │   │       └── select/route.ts
│   │       │   │   ├── submissions/
│   │       │   │   │   ├── route.ts # GET, POST (제출)
│   │       │   │   │   └── [subId]/
│   │       │   │   │       └── review/route.ts
│   │       │   │   └── generate/route.ts # LLM 캠페인 생성
│   │       │   └── open/route.ts # 오픈 캠페인 리스트 (인플루언서용)
│   │       │
│   │       ├── storage/
│   │       │   └── upload/route.ts # Signed URL 생성
│   │       │
│   │       └── admin/
│   │           ├── campaigns/
│   │           │   └── [id]/status/route.ts
│   │           └── reports/
│   │               └── generate/route.ts
│   │
│   ├── lib/                     # 공통 유틸리티
│   │   ├── firebase/
│   │   │   ├── admin.ts         # Firebase Admin 초기화
│   │   │   ├── auth.ts          # 클라이언트 Firebase Auth
│   │   │   └── firestore.ts     # Firestore 헬퍼
│   │   ├── api/
│   │   │   ├── client.ts        # API 클라이언트 (fetch wrapper)
│   │   │   └── types.ts         # API 타입 정의
│   │   ├── llm/
│   │   │   ├── client.ts        # LLM API 클라이언트
│   │   │   ├── prompts.ts       # 프롬프트 템플릿
│   │   │   └── schema.ts        # JSON Schema (Zod)
│   │   ├── auth/
│   │   │   ├── middleware.ts    # 인증 미들웨어
│   │   │   └── roles.ts         # 역할 타입 및 권한
│   │   └── utils/
│   │       ├── validation.ts    # 검증 유틸
│   │       └── constants.ts     # 상수 정의
│   │
│   ├── components/              # 재사용 컴포넌트
│   │   ├── ui/                  # shadcn/ui 컴포넌트
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── RoleGuard.tsx    # 역할 기반 라우트 가드
│   │   ├── campaign/
│   │   │   ├── ProposalView.tsx
│   │   │   ├── SpecSummary.tsx
│   │   │   ├── ClarificationCard.tsx
│   │   │   ├── CandidateList.tsx
│   │   │   └── StatusBadge.tsx
│   │   ├── influencer/
│   │   │   ├── CampaignCard.tsx
│   │   │   ├── BriefView.tsx
│   │   │   └── SubmissionForm.tsx
│   │   └── admin/
│   │       ├── CampaignMonitor.tsx
│   │       └── StatusControl.tsx
│   │
│   └── types/                   # TypeScript 타입 정의
│       ├── user.ts
│       ├── campaign.ts
│       ├── application.ts
│       ├── submission.ts
│       └── index.ts
│
├── scripts/                     # 유틸리티 스크립트
│   ├── seed.ts                  # 샘플 데이터 생성
│   └── deploy-rules.ts          # Firestore Rules 배포
│
├── docs/                        # 문서
│   ├── API.md                   # API 명세서
│   ├── DEPLOYMENT.md            # 배포 가이드
│   └── FIRESTORE_SCHEMA.md      # Firestore 스키마 상세
│
└── README.md                    # 프로젝트 README
```

## 주요 디렉토리 설명

- `(auth)`, `(advertiser)`, `(influencer)`, `(admin)`: Next.js Route Groups
- API Routes는 모두 `/api` 하위에 RESTful 구조로 구성
- 역할별 레이아웃은 각 Route Group의 `layout.tsx`에서 처리
- 공통 컴포넌트는 `components/`에 역할별로 분류
- 타입 정의는 `types/`에 중앙 집중화

