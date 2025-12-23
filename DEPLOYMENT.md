# 배포 가이드

## Vercel 배포

### 1. 저장소 준비

GitHub, GitLab 등에 코드를 푸시합니다.

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

### 2. Vercel 프로젝트 생성

1. [Vercel](https://vercel.com)에 로그인
2. "New Project" 클릭
3. GitHub 저장소 선택
4. 프로젝트 이름 설정

### 3. 환경변수 설정

Vercel 대시보드 → Settings → Environment Variables에서 다음 변수들을 추가:

**클라이언트 환경변수 (모든 환경에 적용):**
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_APP_URL`

**서버 환경변수 (Production, Preview, Development에 모두 적용):**
- `FIREBASE_ADMIN_PROJECT_ID`
- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `FIREBASE_ADMIN_PRIVATE_KEY` (개행 문자 포함 가능)
- `OPENAI_API_KEY`
- `CRON_SECRET`

### 4. 빌드 설정

Vercel은 Next.js 프로젝트를 자동으로 감지하므로 추가 설정이 필요 없습니다.

### 5. 배포

- 코드를 푸시하면 자동으로 배포됩니다
- 또는 Vercel 대시보드에서 "Deploy" 버튼 클릭

### 6. Cron Jobs 설정

`vercel.json`에 정의된 Cron 작업은 Vercel에서 자동으로 활성화됩니다. 

Vercel 대시보드 → Settings → Cron Jobs에서 확인 가능합니다.

**참고**: Vercel의 Cron Jobs는 Hobby 플랜에서도 사용 가능하지만, 실행 빈도에 제한이 있을 수 있습니다.

---

## Firebase 설정

### 1. Firestore 보안 규칙 배포

```bash
# Firebase CLI 설치 (이미 설치했다면 생략)
npm install -g firebase-tools

# Firebase 로그인
firebase login

# Firebase 프로젝트 초기화 (이미 했다면 생략)
firebase init firestore

# 보안 규칙 배포
firebase deploy --only firestore:rules

# 인덱스 배포
firebase deploy --only firestore:indexes
```

### 2. Storage 보안 규칙 배포

```bash
firebase deploy --only storage:rules
```

---

## 환경변수 상세 설명

### Firebase Admin Private Key

서비스 계정 키에서 `private_key` 필드 값을 복사합니다. 
JSON 문자열이므로 따옴표와 이스케이프 문자를 포함합니다.

Vercel 환경변수에 입력할 때:
- 전체 값을 따옴표로 감싸지 말 것
- `\n`은 실제 개행 문자로 변환될 수 있으므로 주의

**권장 방법**: 
환경변수에 직접 입력하는 대신, `.env.local`에서 복사하거나
Firebase Console에서 새 키를 생성하여 직접 복사

---

## 문제 해결

### Cron Jobs가 실행되지 않는 경우

1. Vercel 대시보드에서 Cron Jobs 상태 확인
2. `CRON_SECRET` 환경변수 확인
3. Cron API Route의 인증 로직 확인
4. Vercel 로그에서 에러 확인

### Firebase Admin 초기화 오류

1. `FIREBASE_ADMIN_PRIVATE_KEY` 형식 확인 (개행 문자 포함 확인)
2. `FIREBASE_ADMIN_CLIENT_EMAIL` 정확성 확인
3. `FIREBASE_ADMIN_PROJECT_ID` 일치 확인

### LLM API 오류

1. `OPENAI_API_KEY` 유효성 확인
2. API 사용량 제한 확인
3. Vercel 함수 타임아웃 설정 확인 (기본 10초, 최대 60초)

---

## 모니터링

### Vercel

- Functions 탭에서 API Route 실행 로그 확인
- Analytics 탭에서 트래픽 모니터링

### Firebase

- Firestore Usage 탭에서 읽기/쓰기 사용량 확인
- Authentication 탭에서 사용자 활동 확인

---

## 스케일링 고려사항

### Vercel

- Hobby 플랜: 무료지만 제한 있음
- Pro 플랜: 더 많은 함수 실행 시간, 더 많은 대역폭
- Enterprise: 커스텀 요구사항 대응

### Firebase

- Firestore: 읽기/쓰기 횟수에 따라 과금
- Storage: 저장 용량 및 다운로드에 따라 과금
- Authentication: 무료

### LLM API

- OpenAI GPT-4: 토큰 사용량에 따라 과금
- 캠페인 생성 빈도에 따라 비용 예상 필요

