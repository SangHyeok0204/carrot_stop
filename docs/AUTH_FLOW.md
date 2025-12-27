# 인증 및 사용자 관리 플로우 문서

이 문서는 회원가입과 로그인 절차, 그리고 Firebase 데이터베이스에 저장되는 정보의 형식을 설명합니다.

---

## 목차

1. [회원가입 절차](#회원가입-절차)
2. [로그인 절차](#로그인-절차)
3. [Firebase 데이터베이스 저장 형식](#firebase-데이터베이스-저장-형식)
4. [주요 함수 및 파일](#주요-함수-및-파일)

---

## 회원가입 절차

### 1. 클라이언트 측 (Frontend)

**파일:** `src/app/(auth)/signup/page.tsx`

**함수:** `handleSubmit` (21-56번째 줄)

#### 프로세스:

1. **사용자 입력 수집**
   - `email`: 이메일 주소
   - `password`: 비밀번호 (최소 6자)
   - `displayName`: 사용자 이름
   - `role`: 역할 선택 (`'advertiser'` 또는 `'influencer'`)

2. **Firebase Authentication에 사용자 생성**
   ```typescript
   const auth = getFirebaseAuth();
   const userCredential = await createUserWithEmailAndPassword(auth, email, password);
   const token = await userCredential.user.getIdToken();
   ```
   - `createUserWithEmailAndPassword`: Firebase Auth SDK를 사용하여 이메일/비밀번호로 사용자 생성
   - 생성된 사용자의 ID 토큰 획득

3. **API 엔드포인트 호출**
   ```typescript
   const response = await fetch('/api/auth/signup', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': `Bearer ${token}`,
     },
     body: JSON.stringify({
       email,
       password,
       displayName,
       role,
     }),
   });
   ```
   - `/api/auth/signup` 엔드포인트로 POST 요청
   - Authorization 헤더에 Firebase ID 토큰 포함
   - 사용자 정보를 JSON으로 전송

4. **성공 시 리다이렉트**
   - 성공하면 `/campaigns` 페이지로 이동

### 2. 서버 측 (Backend API)

**파일:** `src/app/api/auth/signup/route.ts`

**함수:** `POST` (6-65번째 줄)

#### 프로세스:

1. **인증 토큰 검증**
   ```typescript
   const user = await verifyAuth(request);
   ```
   - `verifyAuth` 함수로 Authorization 헤더의 토큰 검증
   - 토큰에서 사용자 정보 추출

2. **입력 데이터 검증**
   - `email`, `role` 필수 필드 확인
   - `role`이 `'advertiser'` 또는 `'influencer'`인지 확인
   - 토큰의 이메일과 요청 본문의 이메일 일치 확인

3. **Firestore에 사용자 문서 생성**
   ```typescript
   await createUser(user.uid, {
     email,
     displayName: displayName || undefined,
     role: role as UserRole,
   });
   ```
   - `createUser` 함수 호출 (Firestore에 문서 생성)
   - 문서 ID는 Firebase Auth의 `uid` 사용

4. **응답 반환**
   ```json
   {
     "success": true,
     "data": {
       "uid": "user-uid",
       "email": "user@example.com",
       "role": "advertiser"
     }
   }
   ```

### 3. Firestore 사용자 생성 함수

**파일:** `src/lib/firebase/firestore.ts`

**함수:** `createUser` (40-47번째 줄)

```typescript
export async function createUser(uid: string, data: Omit<UserDocument, 'createdAt' | 'updatedAt'>): Promise<void> {
  const now = Timestamp.now();
  await db.collection('users').doc(uid).set({
    ...data,
    createdAt: now,
    updatedAt: now,
  });
}
```

- `users` 컬렉션에 문서 생성
- 문서 ID는 `uid` (Firebase Auth의 사용자 ID)
- `createdAt`, `updatedAt` 타임스탬프 자동 추가

---

## 로그인 절차

### 1. 클라이언트 측 (Frontend)

**파일:** `src/app/(auth)/login/page.tsx`

**함수:** `handleSubmit` (19-56번째 줄)

#### 프로세스:

1. **사용자 입력 수집**
   - `email`: 이메일 주소
   - `password`: 비밀번호

2. **Firebase Authentication으로 로그인**
   ```typescript
   const auth = getFirebaseAuth();
   const userCredential = await signInWithEmailAndPassword(auth, email, password);
   const token = await userCredential.user.getIdToken();
   ```
   - `signInWithEmailAndPassword`: Firebase Auth SDK를 사용하여 로그인
   - 로그인 성공 시 ID 토큰 획득

3. **사용자 역할 확인**
   ```typescript
   const response = await fetch('/api/auth/me', {
     headers: {
       'Authorization': `Bearer ${token}`,
     },
   });
   const data = await response.json();
   ```
   - `/api/auth/me` 엔드포인트로 사용자 정보 조회
   - 토큰을 Authorization 헤더에 포함

4. **역할에 따른 리다이렉트**
   ```typescript
   if (data.success) {
     const role = data.data.role;
     if (role === 'admin') {
       router.push('/admin/dashboard');
     } else {
       router.push('/campaigns');
     }
   }
   ```
   - `admin` 역할: `/admin/dashboard`로 이동
   - 그 외 역할: `/campaigns`로 이동

### 2. 서버 측 (Backend API)

**파일:** `src/app/api/auth/me/route.ts`

**함수:** `GET` (5-36번째 줄)

#### 프로세스:

1. **인증 토큰 검증**
   ```typescript
   const user = await verifyAuth(request);
   ```
   - `verifyAuth` 함수로 토큰 검증

2. **Firestore에서 사용자 정보 조회**
   ```typescript
   const userData = await getUserById(user.uid);
   ```
   - `getUserById` 함수로 Firestore에서 사용자 문서 조회

3. **응답 반환**
   ```json
   {
     "success": true,
     "data": {
       "uid": "user-uid",
       "email": "user@example.com",
       "displayName": "User Name",
       "role": "advertiser",
       "profile": { ... },
       "createdAt": "2024-01-01T00:00:00.000Z",
       "updatedAt": "2024-01-01T00:00:00.000Z"
     }
   }
   ```

### 3. 인증 미들웨어

**파일:** `src/lib/auth/middleware.ts`

**함수:** `verifyAuth` (16-55번째 줄)

#### 프로세스:

1. **Authorization 헤더에서 토큰 추출**
   ```typescript
   const authHeader = request.headers.get('authorization');
   const token = authHeader.split('Bearer ')[1];
   ```

2. **Firebase Admin SDK로 토큰 검증**
   ```typescript
   const auth = getAdminAuth();
   const decodedToken = await auth.verifyIdToken(token);
   ```

3. **Firestore에서 사용자 역할 조회**
   ```typescript
   const db = getAdminFirestore();
   const userDoc = await db.collection('users').doc(decodedToken.uid).get();
   const userData = userDoc.data();
   ```

4. **사용자 정보 반환**
   ```typescript
   return {
     uid: decodedToken.uid,
     email: decodedToken.email,
     role: userData.role as UserRole,
   };
   ```

---

## Firebase 데이터베이스 저장 형식

### 1. Firebase Authentication

Firebase Authentication은 사용자의 인증 정보를 저장합니다.

**저장 위치:** Firebase Console → Authentication

**저장되는 정보:**
- `uid`: 고유 사용자 ID (문자열)
- `email`: 이메일 주소
- `emailVerified`: 이메일 인증 여부 (boolean)
- `passwordHash`: 해시된 비밀번호 (직접 접근 불가)
- `providerData`: 인증 제공자 정보
- `metadata`: 생성 시간, 마지막 로그인 시간 등

**예시:**
```
Authentication Users:
  - uid: "abc123def456"
  - email: "user@example.com"
  - emailVerified: false
  - providers: ["password"]
  - createdAt: 2024-01-01T00:00:00.000Z
  - lastSignInTime: 2024-01-01T00:00:00.000Z
```

### 2. Firestore Database

Firestore는 사용자의 추가 정보와 역할을 저장합니다.

**컬렉션:** `users`

**문서 ID:** Firebase Auth의 `uid`와 동일

**문서 구조:**

```typescript
{
  email: string;                    // 이메일 주소
  displayName?: string;              // 사용자 이름 (선택)
  role: "advertiser" | "influencer" | "admin";  // 역할
  profile?: {                       // 프로필 정보 (선택)
    companyName?: string;            // 회사명 (광고주용)
    bio?: string;                   // 소개
    platforms?: string[];           // 플랫폼 목록 (인플루언서용)
    followerCount?: number;         // 팔로워 수 (인플루언서용)
  };
  createdAt: Timestamp;             // 생성 시간
  updatedAt: Timestamp;             // 수정 시간
}
```

**Firestore 저장 형식 예시:**

```
users/
  └── abc123def456/  (문서 ID = Firebase Auth uid)
      ├── email: "user@example.com"
      ├── displayName: "홍길동"
      ├── role: "advertiser"
      ├── profile: {
      │     companyName: "예시 회사"
      │   }
      ├── createdAt: Timestamp(2024-01-01T00:00:00.000Z)
      └── updatedAt: Timestamp(2024-01-01T00:00:00.000Z)
```

**타입 정의:**

**파일:** `src/types/user.ts`

```typescript
export type UserRole = "advertiser" | "influencer" | "admin";

export interface UserProfile {
  companyName?: string;
  bio?: string;
  platforms?: string[];
  followerCount?: number;
}

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  profile?: UserProfile;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserDocument {
  email: string;
  displayName?: string;
  role: UserRole;
  profile?: UserProfile;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}
```

**참고:**
- `UserDocument`는 Firestore에 저장되는 형식 (Timestamp 사용)
- `User`는 애플리케이션에서 사용하는 형식 (Date 사용)
- `firestore.ts`의 `timestampToDate` 함수로 변환

---

## 주요 함수 및 파일

### 클라이언트 측

| 파일 | 함수/컴포넌트 | 설명 |
|------|--------------|------|
| `src/app/(auth)/signup/page.tsx` | `SignupPage` | 회원가입 페이지 컴포넌트 |
| `src/app/(auth)/signup/page.tsx` | `handleSubmit` | 회원가입 폼 제출 핸들러 |
| `src/app/(auth)/login/page.tsx` | `LoginPage` | 로그인 페이지 컴포넌트 |
| `src/app/(auth)/login/page.tsx` | `handleSubmit` | 로그인 폼 제출 핸들러 |
| `src/lib/firebase/auth.ts` | `getFirebaseAuth` | Firebase Auth 인스턴스 반환 |
| `src/lib/firebase/auth.ts` | `getFirebaseApp` | Firebase App 인스턴스 반환 |

### 서버 측

| 파일 | 함수 | 설명 |
|------|------|------|
| `src/app/api/auth/signup/route.ts` | `POST` | 회원가입 API 엔드포인트 |
| `src/app/api/auth/me/route.ts` | `GET` | 현재 사용자 정보 조회 API |
| `src/lib/auth/middleware.ts` | `verifyAuth` | Firebase 토큰 검증 미들웨어 |
| `src/lib/auth/middleware.ts` | `requireRole` | 역할 기반 접근 제어 미들웨어 |
| `src/lib/firebase/firestore.ts` | `createUser` | Firestore에 사용자 문서 생성 |
| `src/lib/firebase/firestore.ts` | `getUserById` | Firestore에서 사용자 조회 |

### 타입 정의

| 파일 | 타입/인터페이스 | 설명 |
|------|----------------|------|
| `src/types/user.ts` | `UserRole` | 사용자 역할 타입 |
| `src/types/user.ts` | `User` | 애플리케이션 사용자 타입 |
| `src/types/user.ts` | `UserDocument` | Firestore 사용자 문서 타입 |
| `src/types/user.ts` | `UserProfile` | 사용자 프로필 타입 |

---

## 플로우 다이어그램

### 회원가입 플로우

```
사용자 입력
    ↓
[signup/page.tsx] handleSubmit
    ↓
Firebase Auth: createUserWithEmailAndPassword
    ↓
ID 토큰 획득
    ↓
POST /api/auth/signup
    ↓
[middleware.ts] verifyAuth (토큰 검증)
    ↓
[signup/route.ts] POST (입력 검증)
    ↓
[firestore.ts] createUser
    ↓
Firestore: users/{uid} 문서 생성
    ↓
성공 응답
    ↓
/campaigns로 리다이렉트
```

### 로그인 플로우

```
사용자 입력
    ↓
[login/page.tsx] handleSubmit
    ↓
Firebase Auth: signInWithEmailAndPassword
    ↓
ID 토큰 획득
    ↓
GET /api/auth/me
    ↓
[middleware.ts] verifyAuth (토큰 검증)
    ↓
[firestore.ts] getUserById
    ↓
Firestore: users/{uid} 문서 조회
    ↓
사용자 정보 반환
    ↓
역할 확인 후 리다이렉트
    - admin → /admin/dashboard
    - 기타 → /campaigns
```

---

## 보안 고려사항

1. **비밀번호**: Firebase Authentication이 자동으로 해시 처리하여 저장
2. **토큰 검증**: 모든 API 요청은 서버 측에서 Firebase Admin SDK로 토큰 검증
3. **역할 기반 접근 제어**: `requireRole` 미들웨어로 역할별 접근 제어
4. **이메일 일치 확인**: 회원가입 시 토큰의 이메일과 요청 본문의 이메일 일치 확인

---

## 참고 자료

- [Firebase Authentication 문서](https://firebase.google.com/docs/auth)
- [Firestore 문서](https://firebase.google.com/docs/firestore)
- [Next.js API Routes 문서](https://nextjs.org/docs/api-routes/introduction)

