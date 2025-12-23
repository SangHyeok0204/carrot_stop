# Git 저장소에 코드 올리기 가이드

## 📋 준비사항

1. Git 설치 확인
   ```powershell
   git --version
   ```
   설치되어 있지 않다면: [Git 다운로드](https://git-scm.com/download/win)

2. GitHub/GitLab 계정 (또는 다른 Git 호스팅 서비스)

---

## 🚀 단계별 가이드

### 1단계: Git 저장소 초기화

프로젝트 폴더에서 실행:

```powershell
git init
```

### 2단계: 파일 추가

모든 파일을 스테이징 영역에 추가:

```powershell
git add .
```

**⚠️ 주의**: `.env.local` 파일은 자동으로 제외됩니다 (`.gitignore`에 포함됨)

### 3단계: 첫 커밋

```powershell
git commit -m "Initial commit: AI 광고 플랫폼 MVP"
```

또는 더 자세한 메시지:

```powershell
git commit -m "Initial commit: AI 관리형 광고 운영 시스템

- Next.js 14 + TypeScript + Firebase
- LLM 기반 캠페인 생성
- 광고주/인플루언서/운영자 역할 분리
- 완전 자동화된 캠페인 운영"
```

### 4단계: 원격 저장소 생성

#### GitHub 사용 시:

1. [GitHub](https://github.com) 접속
2. 우측 상단 "+" → "New repository" 클릭
3. Repository name 입력 (예: `ai-advertising-platform`)
4. Description 입력 (선택 사항)
5. **Public** 또는 **Private** 선택
6. **"Initialize this repository with a README" 체크 해제** (이미 파일이 있으므로)
7. "Create repository" 클릭

#### GitLab 사용 시:

1. [GitLab](https://gitlab.com) 접속
2. "New project" → "Create blank project"
3. Project name 입력
4. Visibility 선택
5. "Initialize repository with a README" 체크 해제
6. "Create project" 클릭

### 5단계: 원격 저장소 연결

GitHub/GitLab에서 제공하는 URL을 복사합니다.

**HTTPS 방식 (권장):**
```powershell
git remote add origin https://github.com/사용자명/저장소명.git
```

**SSH 방식 (SSH 키 설정 필요):**
```powershell
git remote add origin git@github.com:사용자명/저장소명.git
```

예시:
```powershell
git remote add origin https://github.com/yourusername/ai-advertising-platform.git
```

### 6단계: 원격 저장소에 푸시

```powershell
git branch -M main
git push -u origin main
```

**첫 푸시 시 인증 필요:**
- GitHub: Personal Access Token 필요 (비밀번호 대신)
- GitLab: Personal Access Token 또는 비밀번호

---

## 🔐 GitHub Personal Access Token 발급 (필요한 경우)

### GitHub에서 토큰 발급:

1. GitHub → Settings → Developer settings
2. Personal access tokens → Tokens (classic)
3. "Generate new token" → "Generate new token (classic)"
4. Note: `ad-platform` (설명)
5. Expiration: 원하는 기간 선택
6. Scopes: `repo` 체크
7. "Generate token" 클릭
8. **토큰 복사** (한 번만 표시됨!)

### 푸시 시 사용:

```powershell
# Username: GitHub 사용자명
# Password: Personal Access Token (비밀번호 아님!)
```

---

## 📝 전체 명령어 요약

```powershell
# 1. 저장소 초기화
git init

# 2. 파일 추가
git add .

# 3. 커밋
git commit -m "Initial commit: AI 광고 플랫폼 MVP"

# 4. 원격 저장소 연결 (URL은 실제 저장소 URL로 변경)
git remote add origin https://github.com/yourusername/ai-advertising-platform.git

# 5. 브랜치 이름 변경 (선택 사항, 기본이 main이면 생략 가능)
git branch -M main

# 6. 푸시
git push -u origin main
```

---

## ✅ 커밋하면 안 되는 파일 확인

다음 파일들은 **절대 커밋하지 마세요** (이미 `.gitignore`에 포함됨):

- ✅ `.env.local` - 환경변수 (보안 중요!)
- ✅ `*-service-account-key.json` - Firebase 서비스 계정 키
- ✅ `node_modules/` - 의존성 패키지
- ✅ `.next/` - Next.js 빌드 파일
- ✅ `.firebase/` - Firebase 로컬 파일

**확인 방법:**
```powershell
git status
```

`.env.local`이 목록에 나타나지 않으면 정상입니다.

---

## 🔄 이후 업데이트 방법

코드를 수정한 후:

```powershell
# 변경사항 확인
git status

# 변경된 파일 추가
git add .

# 또는 특정 파일만 추가
git add src/app/page.tsx

# 커밋
git commit -m "설명: 무엇을 수정했는지"

# 푸시
git push
```

---

## 🛠️ 문제 해결

### "remote origin already exists" 오류

```powershell
# 기존 원격 저장소 제거
git remote remove origin

# 다시 추가
git remote add origin https://github.com/yourusername/repo.git
```

### "failed to push" 오류

```powershell
# 원격 저장소 URL 확인
git remote -v

# 강제 푸시 (주의: 원격 저장소 내용 덮어씀)
git push -f origin main
```

### 인증 오류

- Personal Access Token 사용 확인
- 토큰 권한 확인 (`repo` 스코프 필요)

---

## 💡 팁

1. **커밋 메시지 규칙:**
   - 간결하고 명확하게
   - 무엇을 했는지 설명
   - 예: `"Fix: Firebase Admin 초기화 오류 수정"`

2. **자주 커밋하기:**
   - 작은 단위로 자주 커밋
   - 기능별로 커밋 분리

3. **브랜치 사용 (선택 사항):**
   ```powershell
   # 새 브랜치 생성
   git checkout -b feature/new-feature
   
   # 작업 후 커밋
   git add .
   git commit -m "Add: 새 기능 추가"
   
   # 메인 브랜치로 병합
   git checkout main
   git merge feature/new-feature
   ```

---

## 📚 추가 학습 자료

- [Git 공식 문서](https://git-scm.com/doc)
- [GitHub 가이드](https://guides.github.com/)
- [Git 명령어 치트시트](https://education.github.com/git-cheat-sheet-education.pdf)

