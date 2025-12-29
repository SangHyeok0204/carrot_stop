# Google 로그인 설정 가이드

## 🚀 빠른 시작

### 1. Firebase Console 설정

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 선택
3. **Authentication** → **Sign-in method** 이동
4. **Google** 제공업체 클릭
5. **사용 설정** 토글 활성화
6. **프로젝트 지원 이메일** 선택
7. **저장** 클릭

### 2. 승인된 도메인 추가 (개발용)

1. **Authentication** → **Settings** → **Authorized domains**
2. `localhost` 확인 (기본으로 포함됨)
3. 배포 도메인도 추가 (예: `your-app.vercel.app`)

### 3. 환경변수 확인

`.env.local` 파일에 다음 변수들이 설정되어 있는지 확인:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
# ... 기타 Firebase 설정
```

### 4. 개발 서버 실행

```bash
npm run dev
```

### 5. 테스트

1. 브라우저에서 `http://localhost:3000/auth/login` 접속
2. **Google로 계속하기** 버튼 클릭
3. Google 계정 선택
4. 역할 선택 (광고주/인플루언서)
5. 추가 정보 입력
6. 약관 동의
7. **가입 완료** 클릭

## 📋 주요 기능

### 이메일 중복 방지

- 같은 이메일로 이미 가입된 경우 차단
- 예: `user@gmail.com`이 이메일/비밀번호로 가입됨
  → 같은 이메일로 Google 로그인 시도 → ❌ 차단
- 친근한 안내 메시지 표시

### 2단계 역할 선택

**Step 1: 역할 선택**
- 광고주 또는 인플루언서 선택

**Step 2: 추가 정보 입력**
- 광고주: 회사명 (필수)
- 인플루언서: 활동명/닉네임 (필수)
- 약관 동의 (필수)

### 자동 프로필 설정

Google 로그인 시 자동으로 저장되는 정보:
- `displayName`: Google 계정 이름
- `email`: Google 이메일
- `photoURL`: Google 프로필 사진 URL (Firestore에 URL만 저장)
- `authProviders`: `["google.com"]`

## 🔧 트러블슈팅

### 팝업이 차단됨

**증상**: Google 로그인 팝업이 뜨지 않음

**해결**:
- 브라우저 팝업 차단 설정 확인
- 자동으로 Redirect 방식으로 전환됨

### "Google 로그인이 활성화되지 않았어요"

**증상**: `auth/operation-not-allowed` 에러

**해결**:
1. Firebase Console 접속
2. Authentication → Sign-in method
3. Google 제공업체 활성화 확인

### "이 이메일은 이미 다른 방법으로 가입되어 있어요"

**증상**: 이메일 중복 에러

**해결**:
- 기존 가입 방법으로 로그인
- 예: 이메일/비밀번호로 가입했으면 해당 방법으로 로그인

### 역할 선택 페이지에서 세션 만료

**증상**: "세션이 만료되었어요" 알림

**해결**:
- 역할 선택은 10분 이내에 완료해야 함
- 다시 로그인 후 진행

## 🎨 UI 커스터마이징

### 버튼 스타일 변경

`src/app/auth/login/page.tsx` 파일에서:

```typescript
<Button
  type="button"
  variant="outline"
  className="w-full h-12 text-base"  // 여기를 수정
  onClick={handleGoogleLogin}
>
  Google로 계속하기
</Button>
```

### 에러 메시지 수정

`src/lib/auth/googleAuth.ts` 파일의 `getFriendlyErrorMessage()` 함수에서:

```typescript
const errorMessages: { [key: string]: string } = {
  'auth/popup-blocked': '앗! 팝업이 차단되었어요. 잠시 후 다시 시도할게요 😊',
  // 메시지를 원하는 대로 수정
};
```

## 📊 데이터 구조

### Firestore: users/{uid}

```typescript
{
  email: "user@gmail.com",
  displayName: "홍길동",
  role: "advertiser",  // 또는 "influencer"
  profile: {
    photoURL: "https://lh3.googleusercontent.com/...",
    companyName: "예시 회사",  // 광고주인 경우
    // 또는
    nickname: "크리에이터",  // 인플루언서인 경우
  },
  authProviders: ["google.com"],
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## 🚀 확장 가능성

### 추가 정보 필드 확장

`src/app/auth/select-role/page.tsx`의 `ROLE_ADDITIONAL_FIELDS`에 필드 추가:

```typescript
const ROLE_ADDITIONAL_FIELDS: Record<UserRole, AdditionalField[]> = {
  advertiser: [
    { key: 'companyName', label: '회사명', required: true },
    // 새 필드 추가
    { 
      key: 'phone', 
      label: '연락처', 
      placeholder: '010-0000-0000',
      required: true, 
      type: 'tel' 
    },
  ],
};
```

자동으로 UI가 생성됩니다!

## 📝 다음 단계

1. **카카오 로그인** 구현
   - UI는 이미 준비됨
   - `src/lib/auth/kakaoAuth.ts` 생성
   - 버튼 핸들러 연결

2. **네이버 로그인** 구현
   - UI는 이미 준비됨
   - `src/lib/auth/naverAuth.ts` 생성
   - 버튼 핸들러 연결

3. **계정 연결 기능**
   - 설정 페이지에서 추가 로그인 방법 연결
   - `linkWithPopup()` 사용

4. **프로필 편집**
   - 회사명, 닉네임 수정 기능
   - 프로필 사진 변경

## 📞 지원

문제가 발생하면:
1. `20251229수정.txt` 파일 참조
2. Firebase Console에서 에러 로그 확인
3. 브라우저 콘솔에서 에러 메시지 확인

## ✅ 체크리스트

- [ ] Firebase Console에서 Google 로그인 활성화
- [ ] 환경변수 설정 완료
- [ ] 개발 서버 실행
- [ ] Google 로그인 테스트 성공
- [ ] 역할 선택 테스트 성공
- [ ] 이메일 중복 방지 테스트
- [ ] 모바일 환경 테스트

