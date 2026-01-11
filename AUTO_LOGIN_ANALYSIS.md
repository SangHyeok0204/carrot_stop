# 자동 로그인 원인 분석

## 🔍 문제 설명

앱이 실행될 때 이전에 로그인한 사용자가 자동으로 로그인되는 현상이 발생합니다.

## 📁 원인 파일 및 코드

### 1. **주요 원인: AuthContext.tsx**

**파일:** `src/contexts/AuthContext.tsx`

**핵심 코드:**
```typescript:86-105:src/contexts/AuthContext.tsx
// Firebase Auth 상태 구독
useEffect(() => {
  const auth = getFirebaseAuth();

  const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
    setFirebaseUser(fbUser);

    if (fbUser) {
      // Firebase 인증됨 -> Firestore에서 사용자 정보 가져오기
      const userData = await fetchUserData(fbUser);
      setUser(userData);
    } else {
      // 로그아웃 상태
      setUser(null);
    }

    setIsLoading(false);
  });

  return () => unsubscribe();
}, [fetchUserData]);
```

**동작 방식:**
- `onAuthStateChanged`는 Firebase Auth의 인증 상태 변경을 감지하는 리스너입니다.
- 앱이 시작될 때마다 이 리스너가 실행됩니다.
- 브라우저에 저장된 인증 정보가 있으면 자동으로 `fbUser`를 반환합니다.

### 2. **Firebase Auth Persistence 설정**

**파일:** `src/lib/firebase/auth.ts`

**현재 코드:**
```typescript:54-60:src/lib/firebase/auth.ts
export function getFirebaseAuth(): Auth {
  if (auth) {
    return auth;
  }
  auth = getAuth(getFirebaseApp());
  return auth;
}
```

**문제점:**
- Firebase Auth는 기본적으로 `browserLocalPersistence`를 사용합니다.
- 이는 브라우저의 로컬 스토리지(IndexedDB)에 인증 정보를 **영구적으로** 저장합니다.
- 브라우저를 닫았다가 다시 열어도 인증 상태가 유지됩니다.

### 3. **Firebase Auth Persistence 타입**

Firebase Auth는 다음 3가지 persistence 타입을 제공합니다:

1. **`browserLocalPersistence`** (기본값) ⚠️
   - 로컬 스토리지에 저장
   - 브라우저를 닫아도 유지
   - **현재 사용 중인 설정**

2. **`browserSessionPersistence`**
   - 세션 스토리지에 저장
   - 브라우저 탭을 닫으면 삭제
   - 새 탭에서는 로그아웃 상태

3. **`inMemoryPersistence`**
   - 메모리에만 저장
   - 페이지 새로고침하면 로그아웃
   - 가장 엄격한 설정

## 🔧 해결 방법

### 방법 1: 세션 기반 Persistence로 변경 (권장)

**파일:** `src/lib/firebase/auth.ts`

```typescript
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, setPersistence, browserSessionPersistence } from 'firebase/auth';

export function getFirebaseAuth(): Auth {
  if (auth) {
    return auth;
  }
  auth = getAuth(getFirebaseApp());
  
  // 세션 기반 persistence 설정
  setPersistence(auth, browserSessionPersistence).catch((error) => {
    console.error('Failed to set auth persistence:', error);
  });
  
  return auth;
}
```

**효과:**
- 브라우저 탭을 닫으면 자동 로그아웃
- 새 탭에서는 로그인하지 않은 상태
- 같은 탭에서는 로그인 상태 유지

### 방법 2: 메모리 기반 Persistence로 변경 (가장 엄격)

```typescript
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, setPersistence, inMemoryPersistence } from 'firebase/auth';

export function getFirebaseAuth(): Auth {
  if (auth) {
    return auth;
  }
  auth = getAuth(getFirebaseApp());
  
  // 메모리 기반 persistence 설정
  setPersistence(auth, inMemoryPersistence).catch((error) => {
    console.error('Failed to set auth persistence:', error);
  });
  
  return auth;
}
```

**효과:**
- 페이지 새로고침 시 자동 로그아웃
- 가장 엄격한 보안 설정

### 방법 3: 명시적으로 로그아웃 처리 (로그인 페이지에서)

**파일:** `src/app/auth/login/page.tsx`

현재는 로그인 페이지에서 자동 리다이렉트만 하고 있습니다:

```typescript:19-24:src/app/auth/login/page.tsx
// 이미 로그인된 경우 마이페이지로 리다이렉트
useEffect(() => {
  if (!authLoading && isLoggedIn) {
    router.replace(getMyPagePath());
  }
}, [authLoading, isLoggedIn, router, getMyPagePath]);
```

명시적으로 로그아웃을 원한다면, 로그인 페이지 진입 시 로그아웃을 실행할 수 있습니다 (권장하지 않음).

## 📊 현재 동작 흐름

1. 사용자가 로그인
   - `src/contexts/AuthContext.tsx`의 `login()` 함수 호출
   - `signInWithEmailAndPassword()` 실행
   - Firebase Auth가 인증 정보를 **로컬 스토리지**에 저장

2. 브라우저를 닫았다가 다시 열기
   - 앱이 시작됨
   - `AuthProvider`가 마운트됨
   - `useEffect`에서 `onAuthStateChanged` 실행
   - Firebase Auth가 로컬 스토리지에서 인증 정보를 읽음
   - `fbUser`가 자동으로 설정됨
   - **자동 로그인 완료**

3. 인증 상태 확인
   - `onAuthStateChanged` 콜백에서 `fetchUserData()` 실행
   - `/api/auth/me`를 호출하여 Firestore에서 사용자 정보 가져오기
   - `user` 상태가 업데이트됨
   - `isLoggedIn`이 `true`가 됨

## 💡 권장 사항

**일반적인 웹 애플리케이션에서는 `browserLocalPersistence`(현재 설정)가 권장됩니다.**

이유:
- 사용자 편의성 향상 (매번 로그인하지 않아도 됨)
- 대부분의 웹 애플리케이션이 사용하는 방식
- 보안은 Firebase Auth 토큰으로 관리됨

**자동 로그인을 막고 싶은 경우:**
- `browserSessionPersistence` 사용 (탭 닫으면 로그아웃)
- 또는 `inMemoryPersistence` 사용 (새로고침하면 로그아웃)

## 🎯 요약

| 항목 | 값 |
|------|-----|
| **원인 파일** | `src/contexts/AuthContext.tsx` (86-105줄) |
| **원인 코드** | `onAuthStateChanged` 리스너 |
| **기본 설정** | `browserLocalPersistence` (로컬 스토리지) |
| **해결 방법** | `setPersistence()`로 변경 가능 |
| **권장 사항** | 현재 설정 유지 (일반적) |

