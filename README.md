# AI 관리형 광고 운영 시스템

자연어로 느낌만 설명하면, LLM이 광고 기획서를 만들고 플랫폼이 끝까지 책임지고 운영해주는 AI 관리형 광고 운영 시스템입니다.

## 특징

- **자연어 입력**: 광고 전문 지식 없이도 자연어로 캠페인 요청 가능
- **AI 기획서 생성**: LLM이 실행 가능한 캠페인 스펙 자동 생성
- **완전 자동화**: 모집/선정/집행/증빙/리포트까지 플랫폼이 책임
- **역할 기반 접근 제어**: 광고주/인플루언서/운영자 역할 분리
- **직접 연락 차단**: 광고주-인플루언서 간 직접 소통 불가 (플랫폼 중심 운영)

## 기술 스택

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Firebase Admin SDK
- **Database**: Firebase Firestore
- **Authentication**: Firebase Authentication
- **Storage**: Firebase Storage
- **AI**: OpenAI GPT-4
- **Deployment**: Vercel (Cron Jobs 포함)

## 시작하기

### 1. 필수 요구사항

- Node.js 18+ 
- npm 또는 yarn
- Firebase 프로젝트
- OpenAI API 키

### 2. Firebase 설정

1. [Firebase Console](https://console.firebase.google.com/)에서 새 프로젝트 생성
2. Authentication 활성화 (Email/Password)
3. Firestore Database 생성
4. Storage 활성화
5. 서비스 계정 키 생성:
   - 프로젝트 설정 → 서비스 계정 → 새 비공개 키 생성
   - JSON 파일 다운로드 (보안 주의!)

### 3. 환경변수 설정

`.env.local` 파일 생성:

```env
# Firebase Config (클라이언트)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Firebase Admin (서버 전용)
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# LLM API
OPENAI_API_KEY=sk-...

# Cron Secret (백그라운드 작업 인증)
CRON_SECRET=your-random-secret-key-here

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Firestore 보안 규칙 배포

```bash
npm install -g firebase-tools
firebase login
firebase init firestore
firebase deploy --only firestore:rules
```

### 5. 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 열기

## 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 인증 페이지
│   ├── (advertiser)/      # 광고주 전용 페이지
│   ├── (influencer)/      # 인플루언서 전용 페이지
│   ├── (admin)/           # 운영자 전용 페이지
│   └── api/               # API Routes
├── components/            # React 컴포넌트
├── lib/                   # 공통 라이브러리
│   ├── firebase/         # Firebase 설정
│   ├── auth/             # 인증/권한
│   ├── llm/              # LLM 통합
│   └── utils/            # 유틸리티
└── types/                # TypeScript 타입 정의
```

## 📚 문서

### 필수 가이드
- **[QUICK_START.md](./QUICK_START.md)** - 빠른 시작 가이드 (환경변수 설정, Firebase 설정 등)
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - 배포 가이드 (Vercel, Firebase)

### 개발 참고 문서
- `docs/ARCHITECTURE.md` - 전체 아키텍처 설계
- `docs/FOLDER_STRUCTURE.md` - 폴더 구조
- `docs/FIRESTORE_SCHEMA.md` - 데이터베이스 스키마
- `docs/API_SPEC.md` - API 명세서
- `docs/LLM_PROMPT_DESIGN.md` - LLM 프롬프트 설계
- `docs/BACKGROUND_JOBS.md` - 백그라운드 작업 설계

## 배포

### Vercel 배포

1. GitHub에 저장소 푸시
2. [Vercel](https://vercel.com)에서 프로젝트 import
3. 환경변수 설정 (Vercel 대시보드)
4. 배포 완료

자세한 내용은 [DEPLOYMENT.md](./DEPLOYMENT.md) 참조

### 환경변수 설정 (Vercel)

배포 후 Vercel 대시보드 → Settings → Environment Variables에서 모든 환경변수 추가

### Cron Jobs

`vercel.json`에 정의된 Cron 작업은 Vercel에서 자동으로 실행됩니다:

- `deadline-reminder`: 매일 오전 9시 (UTC) - 마감 리마인더
- `overdue-detection`: 매일 오전 9시 5분 (UTC) - 지연 감지
- `generate-reports`: 매일 오후 6시 (UTC) - 리포트 생성
- `status-transition`: 매시간 - 상태 자동 전환

## 주요 기능

### 광고주

1. 자연어로 캠페인 요청 입력
2. AI 생성 기획서 검토
3. 확인 질문 답변 (옵션)
4. 승인 후 모집 시작
5. 인플루언서 후보 선정
6. 진행 상태 및 결과 확인

### 인플루언서

1. 오픈 캠페인 탐색
2. 브리프 확인 및 지원
3. 선정 후 콘텐츠 제작
4. 증빙 제출 (URL, 스크린샷, 수치)
5. 승인 상태 확인

### 운영자

1. 전체 캠페인 모니터링
2. 지연/위험 캠페인 관리
3. 페널티 적용
4. 분쟁 처리
5. 리포트 확인

## 라이선스

MIT

