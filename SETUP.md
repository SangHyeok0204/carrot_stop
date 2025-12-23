# 프로젝트 설정 가이드

## 1. 프로젝트 초기 설정

### 의존성 설치

```bash
npm install
```

### 환경변수 파일 생성

`.env.local` 파일을 생성하고 다음 내용을 입력하세요:

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
FIREBASE_STORAGE_BUCKET=your-project.appspot.com

# LLM API
OPENAI_API_KEY=sk-...

# Cron Secret (백그라운드 작업 인증)
CRON_SECRET=your-random-secret-key-here

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 2. Firebase 프로젝트 설정

### 2.1 Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름 입력
4. Google Analytics 설정 (선택 사항)

### 2.2 Authentication 설정

1. Firebase Console → Authentication → 시작하기
2. "이메일/비밀번호" 활성화
3. (선택) Google OAuth 활성화

### 2.3 Firestore Database 설정

1. Firebase Console → Firestore Database → 데이터베이스 만들기
2. 프로덕션 모드로 시작 (보안 규칙은 나중에 배포)
3. 위치 선택 (가장 가까운 리전)

### 2.4 Storage 설정

1. Firebase Console → Storage → 시작하기
2. 기본 보안 규칙으로 시작
3. 위치 선택 (Firestore와 동일한 리전 권장)

### 2.5 서비스 계정 키 생성

1. Firebase Console → 프로젝트 설정 → 서비스 계정
2. "새 비공개 키 생성" 클릭
3. JSON 파일 다운로드
4. JSON 파일에서 다음 정보 추출:
   - `project_id` → `FIREBASE_ADMIN_PROJECT_ID`
   - `client_email` → `FIREBASE_ADMIN_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_ADMIN_PRIVATE_KEY` (전체 문자열, 따옴표 포함)

### 2.6 Firebase 웹 앱 등록

1. Firebase Console → 프로젝트 설정 → 일반
2. "앱 추가" → 웹 선택
3. 앱 닉네임 입력
4. Firebase SDK 설정 값 복사:
   - `apiKey` → `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `authDomain` → `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `projectId` → `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `storageBucket` → `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `messagingSenderId` → `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `appId` → `NEXT_PUBLIC_FIREBASE_APP_ID`

## 3. Firestore 보안 규칙 배포

### Firebase CLI 설치 및 로그인

```bash
npm install -g firebase-tools
firebase login
```

### Firestore 초기화

```bash
firebase init firestore
```

다음 질문에 답변:
- Use an existing project? → Y
- Select a default Firestore project → 생성한 프로젝트 선택
- What file should be used for Firestore Rules? → `firestore.rules` (기본값)
- What file should be used for Firestore indexes? → `firestore.indexes.json` (기본값)

### 규칙 배포

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### Storage 규칙 배포

```bash
firebase deploy --only storage:rules
```

## 4. OpenAI API 키 발급

1. [OpenAI Platform](https://platform.openai.com/) 접속
2. 로그인 또는 계정 생성
3. API Keys 페이지로 이동
4. "Create new secret key" 클릭
5. 키 복사 (한 번만 표시되므로 안전하게 보관)
6. `.env.local`의 `OPENAI_API_KEY`에 입력

## 5. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 열기

## 6. 첫 사용자 생성

### 광고주 계정 생성

1. 회원가입 페이지 접속
2. 역할을 "광고주"로 선택
3. 정보 입력 후 가입

### 인플루언서 계정 생성

1. 회원가입 페이지 접속 (또는 로그아웃 후)
2. 역할을 "인플루언서"로 선택
3. 정보 입력 후 가입

### 운영자(Admin) 계정 생성

운영자 계정은 Firebase Console에서 직접 생성해야 합니다:

1. Firebase Console → Authentication → 사용자
2. "사용자 추가" 클릭
3. 이메일/비밀번호 입력
4. Firestore에서 해당 사용자 문서 생성:
   ```javascript
   // Firebase Console → Firestore Database → 데이터 추가
   컬렉션 ID: users
   문서 ID: [생성한 사용자의 UID]
   필드:
     - email: string (이메일)
     - role: string ("admin")
     - createdAt: timestamp (현재 시간)
     - updatedAt: timestamp (현재 시간)
   ```

## 7. 테스트

### 광고주 플로우 테스트

1. 광고주로 로그인
2. "새 캠페인 만들기" 클릭
3. 자연어로 캠페인 요청 입력
4. 생성된 기획서 검토
5. 승인하여 모집 시작

### 인플루언서 플로우 테스트

1. 인플루언서로 로그인
2. "캠페인 탐색"에서 오픈 캠페인 확인
3. 캠페인 상세 페이지에서 지원
4. 선정 후 증빙 제출

## 문제 해결

### Firebase Admin 초기화 오류

- `FIREBASE_ADMIN_PRIVATE_KEY` 확인: 개행 문자(`\n`)가 포함되어야 함
- 환경변수 파일이 `.env.local`로 저장되었는지 확인
- 서버 재시작 필요

### LLM API 오류

- `OPENAI_API_KEY` 유효성 확인
- API 사용량 제한 확인 (OpenAI 대시보드)
- 네트워크 연결 확인

### 인증 오류

- Firebase Authentication 설정 확인
- Firestore Security Rules 배포 확인
- 브라우저 콘솔에서 에러 메시지 확인

