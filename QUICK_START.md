# 빠른 시작 가이드

## 🚀 지금 해야 할 일 (순서대로)

### 1단계: Firebase 프로젝트 생성 및 설정

#### 1.1 Firebase 프로젝트 생성
1. [Firebase Console](https://console.firebase.google.com/) 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름 입력 (예: `ai-ad-platform`)
4. Google Analytics 설정 (선택 사항)
5. 프로젝트 생성 완료

#### 1.2 Firebase 웹 앱 등록
1. Firebase Console → 프로젝트 설정 (톱니바퀴 아이콘)
2. "앱 추가" → 웹 선택 (</> 아이콘)
3. 앱 닉네임 입력 (예: `Web App`)
4. Firebase Hosting 체크 해제 (사용 안 함)
5. "앱 등록" 클릭
6. **SDK 설정 값 복사** (나중에 사용)

#### 1.3 Authentication 활성화
1. Firebase Console → Authentication
2. "시작하기" 클릭
3. "이메일/비밀번호" 탭 선택
4. "사용 설정" 토글 ON
5. "저장" 클릭

#### 1.4 Firestore Database 생성
1. Firebase Console → Firestore Database
2. "데이터베이스 만들기" 클릭
3. **프로덕션 모드** 선택 (보안 규칙은 나중에 배포)
4. 위치 선택 (가장 가까운 리전, 예: `asia-northeast3` - 서울)
5. "사용 설정" 클릭

#### 1.5 Storage 활성화
1. Firebase Console → Storage
2. "시작하기" 클릭
3. **프로덕션 모드** 선택
4. 위치 선택 (Firestore와 동일한 리전 권장)
5. "완료" 클릭

#### 1.6 서비스 계정 키 생성 (중요!)
1. Firebase Console → 프로젝트 설정 → 서비스 계정
2. "새 비공개 키 생성" 클릭
3. 경고 확인 후 "키 생성" 클릭
4. **JSON 파일이 자동으로 다운로드됨** (안전하게 보관!)
5. JSON 파일을 열어서 다음 값들을 복사:
   - `project_id` → `FIREBASE_ADMIN_PROJECT_ID`
   - `client_email` → `FIREBASE_ADMIN_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_ADMIN_PRIVATE_KEY` (전체 문자열, 따옴표 포함)

---

### 2단계: OpenAI API 키 발급

1. [OpenAI Platform](https://platform.openai.com/) 접속
2. 로그인 또는 계정 생성
3. 왼쪽 메뉴 → "API keys"
4. "Create new secret key" 클릭
5. 키 이름 입력 (예: `ad-platform`)
6. **키 복사** (한 번만 표시되므로 안전하게 보관!)
   - 형식: `sk-...` 또는 `sk-proj-...`로 시작
   - 예시: `sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

**참고**: 
- 무료 크레딧이 제공될 수 있음
- 사용량에 따라 과금됨 (GPT-4는 비용이 높을 수 있음)
- 대량 사용 전에 사용량 제한 설정 권장

---

### 3단계: 환경변수 파일 생성

프로젝트 루트에 `.env.local` 파일을 생성하세요. (공유 금지)

#### Windows (PowerShell)
```powershell
New-Item -Path .env.local -ItemType File
```

#### 또는 직접 생성
프로젝트 루트 폴더에 `.env.local` 파일을 만들고 아래 내용을 복사하세요.

```env
# ============================================
# Firebase Config (클라이언트용)
# Firebase Console → 프로젝트 설정 → 일반 → SDK 설정 및 구성
# ============================================
NEXT_PUBLIC_FIREBASE_API_KEY=여기에_API_KEY_입력
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=여기에_AUTH_DOMAIN_입력
NEXT_PUBLIC_FIREBASE_PROJECT_ID=여기에_PROJECT_ID_입력
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=여기에_STORAGE_BUCKET_입력
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=여기에_MESSAGING_SENDER_ID_입력
NEXT_PUBLIC_FIREBASE_APP_ID=여기에_APP_ID_입력

# ============================================
# Firebase Admin (서버용)
# 서비스 계정 JSON 파일에서 가져온 값
# ============================================
FIREBASE_ADMIN_PROJECT_ID=여기에_PROJECT_ID_입력
FIREBASE_ADMIN_CLIENT_EMAIL=여기에_CLIENT_EMAIL_입력
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n여기에_PRIVATE_KEY_전체_입력\n-----END PRIVATE KEY-----\n"

# Storage Bucket (선택 사항, 자동 감지됨)
FIREBASE_STORAGE_BUCKET=여기에_STORAGE_BUCKET_입력

# ============================================
# OpenAI API
# OpenAI Platform → API keys에서 발급
# ============================================
OPENAI_API_KEY=sk-여기에_API_KEY_입력

# ============================================
# Cron Secret (백그라운드 작업 인증용)
# 랜덤 문자열 생성 (예: openssl rand -hex 32)
# ============================================
CRON_SECRET=여기에_랜덤_문자열_입력

# ============================================
# App Config
# ============================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### CRON_SECRET 생성 방법

**Windows (PowerShell)**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

**또는 온라인 도구 사용**
- [Random.org](https://www.random.org/strings/)에서 32자 랜덤 문자열 생성

---

### 4단계: Firebase 보안 규칙 배포

#### 4.1 Firebase CLI 설치
```powershell
npm install -g firebase-tools
```

#### 4.2 Firebase 로그인
```powershell
firebase login
```
브라우저가 열리면 Google 계정으로 로그인

#### 4.3 Firestore 초기화
```powershell
firebase init firestore
```

질문에 답변:
- **Use an existing project?** → `Y`
- **Select a default Firestore project** → 생성한 프로젝트 선택
- **What file should be used for Firestore Rules?** → `firestore.rules` (기본값, Enter)
- **What file should be used for Firestore indexes?** → `firestore.indexes.json` (기본값, Enter)

#### 4.4 보안 규칙 배포
```powershell
# Firestore 규칙 배포
firebase deploy --only firestore:rules

# Firestore 인덱스 배포
firebase deploy --only firestore:indexes

# Storage 규칙 배포
firebase deploy --only storage:rules
```

---

### 5단계: 개발 서버 실행

```powershell
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

---

## ✅ 체크리스트

### 필수 항목
- [ ] Firebase 프로젝트 생성 완료
- [ ] Firebase 웹 앱 등록 완료
- [ ] Authentication 활성화 (이메일/비밀번호)
- [ ] Firestore Database 생성 완료
- [ ] Storage 활성화 완료
- [ ] 서비스 계정 키 다운로드 및 정보 추출
- [ ] OpenAI API 키 발급
- [ ] `.env.local` 파일 생성 및 모든 값 입력
- [ ] Firebase CLI 설치 및 로그인
- [ ] Firestore/Storage 보안 규칙 배포
- [ ] 개발 서버 실행 성공

### 테스트 항목
- [ ] 회원가입 페이지 접속 가능
- [ ] 광고주 계정 생성 성공
- [ ] 인플루언서 계정 생성 성공
- [ ] 로그인 성공
- [ ] 캠페인 생성 테스트 (LLM API 호출)

---

## 🔧 문제 해결

### 환경변수 오류
- `.env.local` 파일이 프로젝트 루트에 있는지 확인
- 모든 값이 따옴표 없이 입력되었는지 확인 (PRIVATE_KEY 제외)
- 서버 재시작 필요 (`npm run dev` 중지 후 다시 시작)

### Firebase Admin 오류
- `FIREBASE_ADMIN_PRIVATE_KEY`에 개행 문자(`\n`)가 포함되어 있는지 확인
- JSON 파일의 `private_key` 값을 그대로 복사 (따옴표 포함)

### OpenAI API 오류
- API 키가 올바른지 확인 (`sk-`로 시작)
- OpenAI 대시보드에서 사용량 제한 확인
- 계정에 크레딧이 있는지 확인

### Firestore 규칙 배포 오류
- `firebase login` 완료 확인
- 올바른 프로젝트 선택 확인
- `firestore.rules` 파일이 존재하는지 확인

---

## 📝 다음 단계 (선택 사항)

1. **운영자 계정 생성**: Firestore에서 직접 `admin` 역할 사용자 생성
2. **테스트 데이터**: 샘플 캠페인 생성 테스트
3. **배포 준비**: Vercel 배포 (DEPLOYMENT.md 참조)

---

## 💡 팁

- **환경변수 보안**: `.env.local`은 절대 Git에 커밋하지 마세요 (이미 .gitignore에 포함됨)
- **API 키 관리**: 프로덕션에서는 환경변수 관리 서비스 사용 권장
- **비용 관리**: OpenAI API 사용량 모니터링 설정 권장
- **로컬 개발**: Firebase Emulator 사용 가능 (선택 사항)

