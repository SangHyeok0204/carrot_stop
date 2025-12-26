# 회원가입 및 로그인 상세 플로우 문서

이 문서는 회원가입과 로그인 과정을 프론트엔드, 백엔드, 데이터베이스의 상호작용을 포함하여 상세하게 설명합니다.

---

## 목차

1. [회원가입 상세 플로우](#회원가입-상세-플로우)
2. [로그인 상세 플로우](#로그인-상세-플로우)
3. [주요 함수 및 파일 상세 설명](#주요-함수-및-파일-상세-설명)
4. [데이터베이스 저장 형식](#데이터베이스-저장-형식)

---

## 회원가입 상세 플로우

### 전체 플로우 다이어그램

```
[사용자] → [프론트엔드] → [Firebase Auth] → [프론트엔드] → [백엔드 API] → [Firestore DB]
   ↓           ↓              ↓                ↓              ↓              ↓
 입력        폼 제출      사용자 생성      토큰 획득      토큰 검증      문서 생성
```

### 단계별 상세 설명

#### 1단계: 사용자 입력 및 폼 제출

**파일:** `src/app/(auth)/signup/page.tsx`  
**함수:** `handleSubmit` (21-84번째 줄)

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError('');
  
  let createdUser: any = null;
  // ...
}
```

**기능:**
- 폼 제출 이벤트를 받아 기본 동작(페이지 새로고침) 방지
- 로딩 상태를 `true`로 설정하여 버튼 비활성화 및 "가입 중..." 표시
- 에러 메시지 초기화
- `createdUser` 변수 선언: 나중에 롤백 처리를 위해 사용

**사용자 입력 데이터:**
- `email`: 이메일 주소
- `password`: 비밀번호 (최소 6자)
- `displayName`: 사용자 이름
- `role`: 역할 선택 (`'advertiser'` 또는 `'influencer'`)

---

#### 2단계: Firebase Authentication에 사용자 생성

**파일:** `src/app/(auth)/signup/page.tsx`  
**코드:** 28-34번째 줄

```typescript
const auth = getFirebaseAuth();

// Firebase Auth에 사용자 생성
const userCredential = await createUserWithEmailAndPassword(auth, email, password);
createdUser = userCredential.user;
const token = await createdUser.getIdToken();
```

**기능:**
- `getFirebaseAuth()`: Firebase Auth 인스턴스 가져오기
- `createUserWithEmailAndPassword()`: Firebase Auth SDK를 사용하여 이메일/비밀번호로 사용자 생성
  - 이 함수는 Firebase 서버와 직접 통신
  - 비밀번호는 자동으로 해시 처리되어 저장됨
- `createdUser`: 생성된 사용자 객체를 저장 (나중에 롤백 시 사용)
- `getIdToken()`: 생성된 사용자의 ID 토큰 획득
  - 이 토큰은 사용자의 인증 상태를 증명하는 JWT 토큰
  - 백엔드 API에서 사용자 인증 확인에 사용

**Firebase Auth에 저장되는 정보:**
- `uid`: 고유 사용자 ID (예: "abc123def456")
- `email`: 이메일 주소
- `passwordHash`: 해시된 비밀번호 (직접 접근 불가)
- `metadata`: 생성 시간, 마지막 로그인 시간 등

**에러 처리:**
- `auth/email-already-in-use`: 이미 존재하는 이메일
- `auth/weak-password`: 비밀번호가 너무 약함
- `auth/invalid-email`: 유효하지 않은 이메일 형식

---

#### 3단계: 백엔드 API 호출

**파일:** `src/app/(auth)/signup/page.tsx`  
**코드:** 36-49번째 줄

```typescript
// API로 사용자 정보 생성
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

**기능:**
- `/api/auth/signup` 엔드포인트로 POST 요청
- `Authorization` 헤더에 Firebase ID 토큰 포함
  - 형식: `Bearer <token>`
  - 백엔드에서 이 토큰을 검증하여 사용자 인증 확인
- 요청 본문에 사용자 정보 전송 (JSON 형식)

**전송되는 데이터:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "displayName": "홍길동",
  "role": "advertiser"
}
```

---

#### 4단계: 백엔드 토큰 검증

**파일:** `src/app/api/auth/signup/route.ts`  
**함수:** `POST` (6-66번째 줄)  
**코드:** 10번째 줄

```typescript
const user = await verifyAuth(request, { requireUserDocument: false });
```

**기능:**
- `verifyAuth()` 함수 호출하여 토큰 검증
- `requireUserDocument: false` 옵션 전달
  - 회원가입 시점에는 Firestore에 사용자 문서가 아직 없으므로
  - 이 옵션을 `false`로 설정하면 Firestore 문서 확인을 건너뜀
  - 토큰만 검증하고 사용자 정보 반환

**파일:** `src/lib/auth/middleware.ts`  
**함수:** `verifyAuth` (19-71번째 줄)

```typescript
export async function verifyAuth(
  request: NextRequest,
  options: { requireUserDocument?: boolean } = {}
): Promise<{ uid: string; email?: string; role?: UserRole; } | null> {
  const { requireUserDocument = true } = options;
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const auth = getAdminAuth();
    const decodedToken = await auth.verifyIdToken(token);
    
    // 사용자 문서 확인이 필요하지 않은 경우 (회원가입 등)
    if (!requireUserDocument) {
      return {
        uid: decodedToken.uid,
        email: decodedToken.email,
        role: undefined,
      };
    }
    // ...
  }
}
```

**기능:**
1. **Authorization 헤더 추출** (28번째 줄)
   - `request.headers.get('authorization')`로 헤더 가져오기
   - `Bearer ` 접두사 확인

2. **토큰 추출** (34번째 줄)
   - `Bearer ` 뒤의 토큰 문자열 추출

3. **Firebase Admin SDK로 토큰 검증** (37-38번째 줄)
   - `getAdminAuth()`: Firebase Admin Auth 인스턴스 가져오기
   - `verifyIdToken()`: 토큰을 검증하고 디코딩
     - 토큰이 유효한지 확인
     - 토큰이 만료되지 않았는지 확인
     - 토큰에서 사용자 정보 추출 (`uid`, `email` 등)

4. **사용자 정보 반환** (41-46번째 줄)
   - `requireUserDocument: false`인 경우
   - Firestore 문서 확인 없이 토큰에서 추출한 정보만 반환

**반환값:**
```typescript
{
  uid: "abc123def456",
  email: "user@example.com",
  role: undefined  // 아직 Firestore에 문서가 없으므로
}
```

---

#### 5단계: 입력 데이터 검증

**파일:** `src/app/api/auth/signup/route.ts`  
**코드:** 19-42번째 줄

```typescript
const body = await request.json();
const { email, displayName, role } = body;

// 필수 필드 확인
if (!email || !role) {
  return NextResponse.json(
    { success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } },
    { status: 400 }
  );
}

// 역할 유효성 확인
if (!['advertiser', 'influencer'].includes(role)) {
  return NextResponse.json(
    { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid role' } },
    { status: 400 }
  );
}

// 토큰의 사용자와 요청의 이메일이 일치하는지 확인
if (user.email !== email) {
  return NextResponse.json(
    { success: false, error: { code: 'VALIDATION_ERROR', message: 'Email mismatch' } },
    { status: 400 }
  );
}
```

**기능:**
1. **요청 본문 파싱** (19번째 줄)
   - JSON 형식의 요청 본문을 JavaScript 객체로 변환

2. **필수 필드 확인** (22-26번째 줄)
   - `email`과 `role`이 존재하는지 확인
   - 없으면 400 Bad Request 반환

3. **역할 유효성 확인** (29-33번째 줄)
   - `role`이 `'advertiser'` 또는 `'influencer'`인지 확인
   - 다른 값이면 400 Bad Request 반환

4. **이메일 일치 확인** (36-41번째 줄)
   - 토큰에서 추출한 이메일과 요청 본문의 이메일이 일치하는지 확인
   - 보안을 위해: 다른 사용자의 이메일로 가입하는 것을 방지

---

#### 6단계: Firestore에 사용자 문서 생성

**파일:** `src/app/api/auth/signup/route.ts`  
**코드:** 44-49번째 줄

```typescript
// Firestore에 사용자 문서 생성 (이미 Auth에는 생성됨)
await createUser(user.uid, {
  email,
  displayName: displayName || undefined,
  role: role as UserRole,
});
```

**기능:**
- `createUser()` 함수 호출
- 문서 ID는 Firebase Auth의 `uid` 사용
- 이렇게 하면 Auth의 사용자 ID와 Firestore의 문서 ID가 일치

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

**기능:**
1. **타임스탬프 생성** (41번째 줄)
   - `Timestamp.now()`: 현재 시간을 Firestore Timestamp 형식으로 생성

2. **Firestore 문서 생성** (42-46번째 줄)
   - `db.collection('users')`: `users` 컬렉션 참조
   - `.doc(uid)`: 문서 ID를 `uid`로 지정
   - `.set()`: 문서 생성 또는 덮어쓰기
   - `createdAt`, `updatedAt` 자동 추가

**Firestore에 저장되는 데이터:**
```json
{
  "email": "user@example.com",
  "displayName": "홍길동",
  "role": "advertiser",
  "createdAt": Timestamp(2024-01-01T00:00:00.000Z),
  "updatedAt": Timestamp(2024-01-01T00:00:00.000Z)
}
```

**문서 경로:** `users/{uid}` (예: `users/abc123def456`)

---

#### 7단계: 성공 응답 및 리다이렉트

**파일:** `src/app/api/auth/signup/route.ts`  
**코드:** 51-58번째 줄

```typescript
return NextResponse.json({
  success: true,
  data: {
    uid: user.uid,
    email: user.email,
    role,
  },
});
```

**기능:**
- 성공 응답 반환
- 생성된 사용자 정보 포함

**응답 형식:**
```json
{
  "success": true,
  "data": {
    "uid": "abc123def456",
    "email": "user@example.com",
    "role": "advertiser"
  }
}
```

**파일:** `src/app/(auth)/signup/page.tsx`  
**코드:** 51-56번째 줄

```typescript
if (!response.ok) {
  const errorData = await response.json().catch(() => ({}));
  throw new Error(errorData.error?.message || '회원가입에 실패했습니다.');
}

router.push('/campaigns');
```

**기능:**
- 응답이 성공적이면 (`response.ok === true`)
- `/campaigns` 페이지로 리다이렉트

---

#### 8단계: 에러 처리 및 롤백

**파일:** `src/app/(auth)/signup/page.tsx`  
**코드:** 57-83번째 줄

```typescript
catch (err: any) {
  // Firebase Auth에 사용자가 생성되었지만 API 호출이 실패한 경우 롤백
  if (createdUser) {
    try {
      await deleteUser(createdUser);
    } catch (deleteErr) {
      console.error('Failed to delete user after signup failure:', deleteErr);
    }
  }

  // 에러 메시지 처리
  let errorMessage = '회원가입에 실패했습니다.';
  
  if (err.code === 'auth/email-already-in-use') {
    errorMessage = '이미 사용 중인 이메일입니다. 로그인을 시도해보세요.';
  } else if (err.code === 'auth/weak-password') {
    errorMessage = '비밀번호가 너무 약합니다. 더 강한 비밀번호를 사용해주세요.';
  } else if (err.code === 'auth/invalid-email') {
    errorMessage = '유효하지 않은 이메일 주소입니다.';
  } else if (err.message) {
    errorMessage = err.message;
  }

  setError(errorMessage);
}
```

**기능:**
1. **롤백 처리** (59-65번째 줄)
   - Firebase Auth에 사용자가 생성되었지만 API 호출이 실패한 경우
   - `deleteUser()`로 생성된 사용자 삭제
   - 불완전한 상태 방지

2. **에러 메시지 처리** (67-78번째 줄)
   - Firebase 에러 코드에 따라 적절한 메시지 표시
   - 사용자 친화적인 메시지 제공

3. **에러 표시** (80번째 줄)
   - `setError()`로 에러 메시지를 상태에 저장
   - UI에 에러 메시지 표시

---

## 로그인 상세 플로우

### 전체 플로우 다이어그램

```
[사용자] → [프론트엔드] → [Firebase Auth] → [프론트엔드] → [백엔드 API] → [Firestore DB]
   ↓           ↓              ↓                ↓              ↓              ↓
 입력        폼 제출      로그인 검증      토큰 획득      토큰 검증      사용자 조회
                                                                              ↓
[프론트엔드] ← [백엔드 API] ← [Firestore DB]
   ↓
역할 확인 후 리다이렉트
```

### 단계별 상세 설명

#### 1단계: 사용자 입력 및 폼 제출

**파일:** `src/app/(auth)/login/page.tsx`  
**함수:** `handleSubmit` (19-56번째 줄)

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError('');
  // ...
}
```

**기능:**
- 폼 제출 이벤트 처리
- 로딩 상태 활성화
- 에러 메시지 초기화

**사용자 입력 데이터:**
- `email`: 이메일 주소
- `password`: 비밀번호

---

#### 2단계: Firebase Authentication으로 로그인

**파일:** `src/app/(auth)/login/page.tsx`  
**코드:** 24-27번째 줄

```typescript
const auth = getFirebaseAuth();
const userCredential = await signInWithEmailAndPassword(auth, email, password);
const token = await userCredential.user.getIdToken();
```

**기능:**
- `getFirebaseAuth()`: Firebase Auth 인스턴스 가져오기
- `signInWithEmailAndPassword()`: 이메일/비밀번호로 로그인
  - Firebase 서버에서 이메일과 비밀번호 검증
  - 일치하면 사용자 인증 정보 반환
- `getIdToken()`: 로그인한 사용자의 ID 토큰 획득
  - 이 토큰으로 백엔드 API 인증

**Firebase Auth 검증 과정:**
1. 이메일로 사용자 찾기
2. 저장된 비밀번호 해시와 입력한 비밀번호 해시 비교
3. 일치하면 인증 성공

---

#### 3단계: 사용자 역할 확인

**파일:** `src/app/(auth)/login/page.tsx`  
**코드:** 29-50번째 줄

```typescript
// 역할 확인 후 리다이렉트
try {
  const response = await fetch('/api/auth/me', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  const data = await response.json();
  
  if (data.success) {
    const role = data.data.role;
    if (role === 'admin') {
      router.push('/admin/dashboard');
    } else {
      router.push('/campaigns');
    }
  } else {
    router.push('/campaigns');
  }
} catch (error) {
  router.push('/campaigns');
}
```

**기능:**
- `/api/auth/me` 엔드포인트로 사용자 정보 조회
- 토큰을 Authorization 헤더에 포함
- 응답에서 사용자 역할 확인
- 역할에 따라 다른 페이지로 리다이렉트
  - `admin`: `/admin/dashboard`
  - 그 외: `/campaigns`

---

#### 4단계: 백엔드 토큰 검증 및 사용자 조회

**파일:** `src/app/api/auth/me/route.ts`  
**함수:** `GET` (5-36번째 줄)

```typescript
export async function GET(request: NextRequest) {
  const user = await verifyAuth(request);
  
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  try {
    const userData = await getUserById(user.uid);
    
    if (!userData) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: userData,
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
```

**기능:**
1. **토큰 검증** (6번째 줄)
   - `verifyAuth()` 호출
   - 이번에는 `requireUserDocument: true` (기본값)
   - Firestore 문서 존재 여부 확인

2. **사용자 정보 조회** (16번째 줄)
   - `getUserById()`로 Firestore에서 사용자 문서 조회

**파일:** `src/lib/firebase/firestore.ts`  
**함수:** `getUserById` (27-38번째 줄)

```typescript
export async function getUserById(uid: string): Promise<User | null> {
  const doc = await db.collection('users').doc(uid).get();
  if (!doc.exists) return null;
  
  const data = doc.data() as UserDocument;
  return {
    uid: doc.id,
    ...data,
    createdAt: timestampToDate(data.createdAt) || new Date(),
    updatedAt: timestampToDate(data.updatedAt) || new Date(),
  };
}
```

**기능:**
1. **문서 조회** (28번째 줄)
   - `db.collection('users').doc(uid).get()`: Firestore에서 문서 가져오기
   - 문서 ID는 `uid` (Firebase Auth의 사용자 ID)

2. **존재 여부 확인** (29번째 줄)
   - 문서가 없으면 `null` 반환

3. **데이터 변환** (31-37번째 줄)
   - Firestore의 `Timestamp`를 JavaScript `Date`로 변환
   - `UserDocument` 타입을 `User` 타입으로 변환

**반환되는 데이터:**
```typescript
{
  uid: "abc123def456",
  email: "user@example.com",
  displayName: "홍길동",
  role: "advertiser",
  profile: { ... },
  createdAt: Date(2024-01-01T00:00:00.000Z),
  updatedAt: Date(2024-01-01T00:00:00.000Z)
}
```

---

#### 5단계: 역할 기반 리다이렉트

**파일:** `src/app/(auth)/login/page.tsx`  
**코드:** 38-44번째 줄

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

**기능:**
- 사용자 역할에 따라 다른 페이지로 이동
- `admin`: 관리자 대시보드
- `advertiser`, `influencer`: 캠페인 페이지

---

## 주요 함수 및 파일 상세 설명

### 프론트엔드 파일

#### 1. `src/app/(auth)/signup/page.tsx`

**역할:** 회원가입 페이지 컴포넌트

**주요 함수:**

| 함수/변수 | 라인 | 기능 |
|----------|------|------|
| `SignupPage` | 12 | 회원가입 페이지 컴포넌트 |
| `handleSubmit` | 21-84 | 폼 제출 핸들러 |
| `email`, `password`, `displayName`, `role` | 14-17 | 사용자 입력 상태 |
| `loading` | 18 | 로딩 상태 |
| `error` | 19 | 에러 메시지 상태 |

**핵심 로직:**
- Firebase Auth에 사용자 생성
- 생성된 사용자의 토큰으로 백엔드 API 호출
- API 실패 시 Firebase Auth에서 사용자 삭제 (롤백)

---

#### 2. `src/app/(auth)/login/page.tsx`

**역할:** 로그인 페이지 컴포넌트

**주요 함수:**

| 함수/변수 | 라인 | 기능 |
|----------|------|------|
| `LoginPage` | 12 | 로그인 페이지 컴포넌트 |
| `handleSubmit` | 19-56 | 폼 제출 핸들러 |
| `email`, `password` | 14-15 | 사용자 입력 상태 |
| `loading` | 16 | 로딩 상태 |
| `error` | 17 | 에러 메시지 상태 |

**핵심 로직:**
- Firebase Auth로 로그인
- 토큰으로 사용자 정보 조회
- 역할에 따라 리다이렉트

---

### 백엔드 파일

#### 3. `src/app/api/auth/signup/route.ts`

**역할:** 회원가입 API 엔드포인트

**주요 함수:**

| 함수 | 라인 | 기능 |
|------|------|------|
| `POST` | 6-66 | 회원가입 API 핸들러 |

**처리 과정:**
1. 토큰 검증 (`verifyAuth` with `requireUserDocument: false`)
2. 입력 데이터 검증
3. Firestore에 사용자 문서 생성
4. 성공 응답 반환

---

#### 4. `src/app/api/auth/me/route.ts`

**역할:** 현재 사용자 정보 조회 API

**주요 함수:**

| 함수 | 라인 | 기능 |
|------|------|------|
| `GET` | 5-36 | 사용자 정보 조회 API 핸들러 |

**처리 과정:**
1. 토큰 검증 (`verifyAuth` with `requireUserDocument: true`)
2. Firestore에서 사용자 문서 조회
3. 사용자 정보 반환

---

#### 5. `src/lib/auth/middleware.ts`

**역할:** 인증 미들웨어

**주요 함수:**

| 함수 | 라인 | 기능 |
|------|------|------|
| `verifyAuth` | 19-71 | Firebase 토큰 검증 |
| `requireRole` | 76-98 | 역할 기반 접근 제어 |

**`verifyAuth` 함수 상세:**

```typescript
export async function verifyAuth(
  request: NextRequest,
  options: { requireUserDocument?: boolean } = {}
): Promise<{ uid: string; email?: string; role?: UserRole; } | null>
```

**파라미터:**
- `request`: Next.js 요청 객체
- `options.requireUserDocument`: Firestore 문서 확인 여부 (기본값: `true`)

**처리 과정:**
1. Authorization 헤더에서 토큰 추출
2. Firebase Admin SDK로 토큰 검증
3. `requireUserDocument`가 `true`면 Firestore에서 사용자 문서 조회
4. 사용자 정보 반환

**반환값:**
- 성공: `{ uid, email, role }`
- 실패: `null`

---

#### 6. `src/lib/firebase/firestore.ts`

**역할:** Firestore 데이터베이스 작업

**주요 함수:**

| 함수 | 라인 | 기능 |
|------|------|------|
| `createUser` | 40-47 | Firestore에 사용자 문서 생성 |
| `getUserById` | 27-38 | Firestore에서 사용자 조회 |

**`createUser` 함수:**
- `users` 컬렉션에 문서 생성
- 문서 ID는 `uid` (Firebase Auth의 사용자 ID)
- `createdAt`, `updatedAt` 자동 추가

**`getUserById` 함수:**
- `users` 컬렉션에서 문서 조회
- Firestore `Timestamp`를 JavaScript `Date`로 변환

---

## 데이터베이스 저장 형식

### Firebase Authentication

**저장 위치:** Firebase Console → Authentication

**저장되는 정보:**
```typescript
{
  uid: string;              // 고유 사용자 ID
  email: string;            // 이메일 주소
  emailVerified: boolean;    // 이메일 인증 여부
  passwordHash: string;      // 해시된 비밀번호 (직접 접근 불가)
  providerData: Array;      // 인증 제공자 정보
  metadata: {
    creationTime: string;   // 생성 시간
    lastSignInTime: string; // 마지막 로그인 시간
  }
}
```

**예시:**
```
uid: "abc123def456"
email: "user@example.com"
emailVerified: false
providers: ["password"]
creationTime: "2024-01-01T00:00:00.000Z"
lastSignInTime: "2024-01-01T00:00:00.000Z"
```

---

### Firestore Database

**컬렉션:** `users`  
**문서 ID:** Firebase Auth의 `uid`와 동일

**문서 구조:**
```typescript
{
  email: string;                    // 이메일 주소
  displayName?: string;             // 사용자 이름 (선택)
  role: "advertiser" | "influencer" | "admin";  // 역할
  profile?: {                       // 프로필 정보 (선택)
    companyName?: string;           // 회사명 (광고주용)
    bio?: string;                   // 소개
    platforms?: string[];           // 플랫폼 목록 (인플루언서용)
    followerCount?: number;         // 팔로워 수 (인플루언서용)
  };
  createdAt: Timestamp;            // 생성 시간
  updatedAt: Timestamp;            // 수정 시간
}
```

**Firestore 저장 예시:**
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

---

## 전체 상호작용 요약

### 회원가입 플로우

```
1. 사용자 입력 (프론트엔드)
   ↓
2. Firebase Auth에 사용자 생성 (Firebase 서버)
   ↓
3. ID 토큰 획득 (프론트엔드)
   ↓
4. 백엔드 API 호출 (프론트엔드 → 백엔드)
   ↓
5. 토큰 검증 (백엔드 → Firebase Admin)
   ↓
6. 입력 데이터 검증 (백엔드)
   ↓
7. Firestore에 문서 생성 (백엔드 → Firestore)
   ↓
8. 성공 응답 (백엔드 → 프론트엔드)
   ↓
9. 리다이렉트 (프론트엔드)
```

### 로그인 플로우

```
1. 사용자 입력 (프론트엔드)
   ↓
2. Firebase Auth로 로그인 (Firebase 서버)
   ↓
3. ID 토큰 획득 (프론트엔드)
   ↓
4. 백엔드 API 호출 (프론트엔드 → 백엔드)
   ↓
5. 토큰 검증 (백엔드 → Firebase Admin)
   ↓
6. Firestore에서 사용자 조회 (백엔드 → Firestore)
   ↓
7. 사용자 정보 반환 (백엔드 → 프론트엔드)
   ↓
8. 역할 확인 및 리다이렉트 (프론트엔드)
```

---

## 보안 고려사항

1. **비밀번호 보안**
   - Firebase Authentication이 자동으로 해시 처리
   - 평문 비밀번호는 어디에도 저장되지 않음

2. **토큰 검증**
   - 모든 API 요청은 서버 측에서 Firebase Admin SDK로 토큰 검증
   - 클라이언트에서 토큰을 조작해도 서버에서 검증 실패

3. **역할 기반 접근 제어**
   - Firestore에서 사용자 역할 확인
   - 역할에 따라 다른 권한 부여

4. **이메일 일치 확인**
   - 회원가입 시 토큰의 이메일과 요청 본문의 이메일 일치 확인
   - 다른 사용자의 이메일로 가입하는 것 방지

5. **롤백 처리**
   - 회원가입 실패 시 Firebase Auth에서 생성된 사용자 삭제
   - 불완전한 상태 방지

---

## 참고 자료

- [Firebase Authentication 문서](https://firebase.google.com/docs/auth)
- [Firestore 문서](https://firebase.google.com/docs/firestore)
- [Next.js API Routes 문서](https://nextjs.org/docs/api-routes/introduction)
- [Firebase Admin SDK 문서](https://firebase.google.com/docs/admin/setup)

