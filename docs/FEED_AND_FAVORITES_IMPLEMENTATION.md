# 피드 및 찜하기 기능 구현 문서

## 개요

이 문서는 메인 피드 구조 재설계, 무한 스크롤, 찜하기 기능, 인플루언서 탐색 페이지, 그리고 실시간 업데이트 기능의 구현 내용을 정리합니다.

**작업 기간**: 2024년 12월  
**주요 목표**: 당근마켓 스타일의 실시간 피드 구현 및 사용자 경험 개선

---

## 1. 메인 피드 구조 재설계

### 1.1 목표
- 당근마켓 스타일의 실시간 피드 구현
- 역할별 통합 네비게이션 바 추가
- 사용자 경험 개선

### 1.2 구현 내용

#### Route Group 생성
- `(authenticated)` Route Group 생성
  - 인증된 사용자 전용 페이지 그룹
  - 공통 레이아웃으로 네비게이션 바 통합
  - URL 경로에는 영향을 주지 않음 (괄호는 URL에 포함되지 않음)

#### `/feed` 페이지 생성
- 당근마켓 스타일 카드 그리드 레이아웃
- 역할별 다른 캠페인 표시
  - **광고주**: 자신이 만든 캠페인 목록
  - **인플루언서**: 오픈된 캠페인 목록
  - **관리자**: 모든 캠페인 목록

#### 공통 네비게이션 바
- **위치**: `src/app/(authenticated)/layout.tsx`
- **기능**:
  - 역할별 동적 메뉴 표시
  - 상단 고정 네비게이션 바 (데스크톱)
  - 하단 네비게이션 바 (모바일)
  - 검색바 포함 (데스크톱)
  - 프로필 및 로그아웃 버튼

### 1.3 파일 구조 변경

```
/ (랜딩 페이지)
  └─> 로그인 후 → /feed

/feed (메인 피드 - 당근마켓 스타일)
  ├─> 상단 메뉴바: 역할별 페이지 링크
  ├─> 카드 클릭 → /campaigns/[id]
  ├─> 광고주: "새 캠페인" 플로팅 버튼 → /campaigns/new
  └─> 실시간 업데이트

/campaigns (기존 리스트 - 유지)
  └─> 네비게이션 바에서 접근 가능
```

### 1.4 생성/수정된 파일

**새로 생성된 파일:**
- `src/app/(authenticated)/layout.tsx` - 공통 레이아웃
- `src/app/(authenticated)/feed/page.tsx` - 메인 피드

**수정된 파일:**
- `src/app/page.tsx` - 로그인 후 `/feed`로 리다이렉트
- `src/app/(auth)/login/page.tsx` - 로그인 후 `/feed`로 리다이렉트

---

## 2. 무한 스크롤 구현

### 2.1 목표
- 초기 로딩 시간 단축
- 부드러운 사용자 경험 제공
- 대량의 데이터 효율적 처리

### 2.2 구현 내용

#### `/feed` 페이지 무한 스크롤
- **초기 로드**: 20개 캠페인
- **자동 로드**: 스크롤 시 다음 20개 자동 로드
- **감지 방식**: Intersection Observer API 사용
- **로딩 인디케이터**: 하단에 스피너 표시
- **종료 메시지**: "더 이상 불러올 캠페인이 없습니다"

#### API 페이지네이션 지원
- **기존 API 수정**:
  - `/api/campaigns` - 광고주/관리자용
  - `/api/campaigns/open` - 인플루언서용

- **파라미터**:
  - `limit`: 한 번에 가져올 개수 (기본값: 20)
  - `cursor`: 다음 페이지를 가져오기 위한 커서 (문서 ID)

- **응답 형식**:
  ```json
  {
    "success": true,
    "data": {
      "campaigns": [...],
      "nextCursor": "documentId" // null이면 더 이상 없음
    }
  }
  ```

### 2.3 기술 구현

```typescript
// Intersection Observer로 하단 감지
useEffect(() => {
  if (!loadMoreRef.current || !hasMore || loadingMore) return;

  observerRef.current = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !loadingMore && hasMore) {
        loadMoreCampaigns(userRole, token);
      }
    },
    { threshold: 0.1 }
  );

  observerRef.current.observe(loadMoreRef.current);
}, [hasMore, loadingMore, userRole]);
```

---

## 3. 찜하기 기능 구현

### 3.1 목표
- 인플루언서: 관심 있는 캠페인 저장
- 광고주: 관심 있는 인플루언서 저장
- 찜한 항목 모아보기 기능

### 3.2 데이터 구조

#### Firestore 구조
```
users/{userId}/favorites/
  ├── campaigns/ (문서)
  │   └── itemIds: [campaignId1, campaignId2, ...]
  │   └── updatedAt: Timestamp
  └── influencers/ (문서)
      └── itemIds: [influencerId1, influencerId2, ...]
      └── updatedAt: Timestamp
```

### 3.3 API 엔드포인트

#### 1. 찜한 항목 목록 조회
```
GET /api/favorites?type=campaigns
GET /api/favorites?type=influencers
```

**권한**:
- `campaigns`: 인플루언서만
- `influencers`: 광고주만

**응답**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "...",
        "title": "...",
        ...
      }
    ]
  }
}
```

#### 2. 찜하기 추가/제거
```
POST /api/favorites
```

**요청 본문**:
```json
{
  "type": "campaigns" | "influencers",
  "itemId": "campaignId or influencerId",
  "action": "add" | "remove"
}
```

**응답**:
```json
{
  "success": true,
  "data": {
    "favorited": true,
    "itemIds": [...]
  }
}
```

#### 3. 찜하기 상태 확인
```
GET /api/favorites/check?type=campaigns&itemId=xxx
```

**응답**:
```json
{
  "success": true,
  "data": {
    "favorited": true
  }
}
```

### 3.4 UI 구현

#### `/feed` 페이지
- **인플루언서**: 캠페인 카드에 찜하기 버튼 (하트 아이콘)
- **위치**: 카드 왼쪽 상단
- **상태 표시**: 
  - 찜하지 않음: 회색 하트
  - 찜함: 빨간색 채워진 하트

#### `/feed/favorites` 페이지
- **인플루언서**: 찜한 캠페인 목록
- **광고주**: 찜한 인플루언서 목록
- **기능**: 각 카드에서 찜하기 해제 가능

#### 네비게이션 바
- **인플루언서**: "찜한 캠페인" 메뉴 추가
- **광고주**: "찜한 인플루언서" 메뉴 추가

### 3.5 생성된 파일

- `src/app/api/favorites/route.ts` - 찜하기 API
- `src/app/api/favorites/check/route.ts` - 찜하기 상태 확인 API
- `src/app/(authenticated)/feed/favorites/page.tsx` - 찜한 항목 보기 페이지

---

## 4. 인플루언서 탐색 페이지

### 4.1 목표
- 광고주가 인플루언서를 탐색하고 찜할 수 있는 페이지
- 검색 및 필터 기능 제공

### 4.2 구현 내용

#### `/influencers` 페이지
- **접근 권한**: 광고주, 관리자만
- **기능**:
  - 인플루언서 목록 표시
  - 검색 기능 (이름, 이메일, 소개)
  - 플랫폼 필터 (Instagram, YouTube, TikTok, Blog, Facebook)
  - 무한 스크롤
  - 찜하기 버튼

#### UI 구성
- **카드 그리드 레이아웃**: 3열 (데스크톱), 2열 (태블릿), 1열 (모바일)
- **카드 정보**:
  - 프로필 이미지 영역 (이니셜 표시)
  - 이름 및 이메일
  - 소개 (bio)
  - 플랫폼 배지
  - 팔로워 수
  - 찜하기 버튼

### 4.3 API 구현

#### `GET /api/influencers`
- **권한**: 광고주, 관리자만
- **파라미터**:
  - `limit`: 한 번에 가져올 개수 (기본값: 20)
  - `cursor`: 페이지네이션 커서
  - `search`: 검색어 (이름, 이메일, 소개)
  - `platform`: 플랫폼 필터

- **응답**:
```json
{
  "success": true,
  "data": {
    "influencers": [...],
    "nextCursor": "documentId"
  }
}
```

### 4.4 생성된 파일

- `src/app/api/influencers/route.ts` - 인플루언서 목록 API
- `src/app/(authenticated)/influencers/page.tsx` - 인플루언서 탐색 페이지

---

## 5. 실시간 업데이트 구현

### 5.1 목표
- Firestore `onSnapshot`을 사용한 실시간 데이터 동기화
- 여러 탭에서도 동일한 상태 유지

### 5.2 구현 내용

#### 적용된 페이지

1. **`/feed` 페이지** (인플루언서)
   - 캠페인 찜하기 상태 실시간 동기화
   - 다른 탭에서 찜하기 변경 시 자동 반영

2. **`/influencers` 페이지** (광고주)
   - 인플루언서 목록 실시간 업데이트
   - 인플루언서 찜하기 상태 실시간 동기화

3. **`/feed/favorites` 페이지**
   - 찜한 항목 목록 실시간 동기화
   - 찜하기 해제 시 목록에서 자동 제거

### 5.3 기술 구현

#### Firestore 클라이언트 SDK 사용
```typescript
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { getFirebaseApp } from '@/lib/firebase/auth';

const db = getFirestore(getFirebaseApp());
const favoritesDocRef = doc(db, 'users', userId, 'favorites', 'campaigns');

// 실시간 구독
const unsubscribe = onSnapshot(favoritesDocRef, (docSnapshot) => {
  if (docSnapshot.exists()) {
    const data = docSnapshot.data();
    const itemIds = data?.itemIds || [];
    setFavoritedIds(new Set(itemIds));
  }
});

// 컴포넌트 언마운트 시 구독 해제
return () => {
  if (unsubscribe) unsubscribe();
};
```

#### 동작 방식
1. 사용자가 찜하기 클릭
2. API 호출 → Firestore 업데이트
3. `onSnapshot`이 변경 감지
4. UI 자동 업데이트
5. 여러 탭에서도 동일하게 동기화

### 5.4 성능 고려사항
- 컴포넌트 언마운트 시 구독 해제 필수
- 불필요한 리렌더링 방지를 위한 상태 관리 최적화
- 에러 핸들링 추가

---

## 6. 네비게이션 바 메뉴 구조

### 6.1 광고주 메뉴
- 홈 (`/feed`)
- 내 캠페인 (`/campaigns`)
- 새 캠페인 (`/campaigns/new`)
- **인플루언서 탐색** (`/influencers`) ← 신규
- **찜한 인플루언서** (`/feed/favorites`) ← 신규

### 6.2 인플루언서 메뉴
- 홈 (`/feed`)
- 오픈 캠페인 (`/campaigns`)
- **찜한 캠페인** (`/feed/favorites`) ← 신규

### 6.3 관리자 메뉴
- 홈 (`/feed`)
- 대시보드 (`/admin/dashboard`)
- 캠페인 관리 (`/admin/campaigns`)

---

## 7. 주요 기술 스택

### 7.1 프론트엔드
- **Next.js App Router**: Route Groups, Server Components
- **React Hooks**: `useState`, `useEffect`, `useRef`
- **TypeScript**: 타입 안정성
- **Tailwind CSS**: 유틸리티 퍼스트 CSS
- **Lucide React**: 아이콘 라이브러리

### 7.2 백엔드
- **Firebase Firestore**: 실시간 데이터베이스
- **Firebase Admin SDK**: 서버 측 Firestore 접근
- **Firebase Client SDK**: 클라이언트 측 실시간 업데이트

### 7.3 API
- **Next.js API Routes**: 서버리스 함수
- **페이지네이션**: Cursor 기반
- **인증/권한**: Firebase Auth 토큰 검증

---

## 8. 개선 사항 및 효과

### 8.1 사용자 경험 개선
- ✅ 당근마켓 스타일의 직관적인 피드
- ✅ 실시간 업데이트로 즉각적인 반영
- ✅ 무한 스크롤로 부드러운 탐색
- ✅ 찜하기로 관심 항목 관리

### 8.2 기능 확장
- ✅ 인플루언서 탐색으로 협업 파트너 찾기
- ✅ 역할별 맞춤 메뉴
- ✅ 검색 및 필터 기능

### 8.3 성능 개선
- ✅ 페이지네이션으로 초기 로딩 시간 단축
- ✅ 실시간 업데이트로 서버 폴링 불필요
- ✅ 효율적인 데이터 로딩

---

## 9. 파일 목록

### 9.1 새로 생성된 파일

#### 페이지
- `src/app/(authenticated)/layout.tsx` - 공통 레이아웃
- `src/app/(authenticated)/feed/page.tsx` - 메인 피드
- `src/app/(authenticated)/feed/favorites/page.tsx` - 찜한 항목
- `src/app/(authenticated)/influencers/page.tsx` - 인플루언서 탐색

#### API
- `src/app/api/favorites/route.ts` - 찜하기 API
- `src/app/api/favorites/check/route.ts` - 찜하기 상태 확인 API
- `src/app/api/influencers/route.ts` - 인플루언서 목록 API

### 9.2 수정된 파일
- `src/app/page.tsx` - 로그인 후 `/feed`로 리다이렉트
- `src/app/(auth)/login/page.tsx` - 로그인 후 `/feed`로 리다이렉트
- `src/app/(authenticated)/layout.tsx` - 네비게이션 바 메뉴 추가

---

## 10. 향후 개선 가능 사항

### 10.1 기능 개선
- [ ] 찜한 항목 정렬 기능 (최신순, 이름순 등)
- [ ] 찜한 항목에 태그/카테고리 추가
- [ ] 인플루언서 상세 프로필 페이지
- [ ] 찜한 항목 공유 기능

### 10.2 성능 개선
- [ ] 캐싱 전략 개선 (SWR 또는 React Query)
- [ ] 이미지 최적화 (Next.js Image 컴포넌트 활용)
- [ ] 가상 스크롤링 (대량 데이터 처리)

### 10.3 UX 개선
- [ ] 찜하기 애니메이션 효과
- [ ] 알림 기능 (찜한 캠페인 업데이트 시)
- [ ] 검색 자동완성
- [ ] 필터 저장 기능

---

## 11. 참고 자료

### 11.1 관련 문서
- [Firestore 스키마 문서](./FIRESTORE_SCHEMA.md)
- [프로젝트 구조 개요](./PROJECT_STRUCTURE_OVERVIEW.md)
- [인증 플로우 문서](./AUTH_FLOW.md)

### 11.2 외부 링크
- [Firebase Firestore 실시간 업데이트](https://firebase.google.com/docs/firestore/query-data/listen)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)

---

## 12. 변경 이력

| 날짜 | 변경 내용 | 작성자 |
|------|----------|--------|
| 2024-12-27 | 메인 피드 구조 재설계 | - |
| 2024-12-27 | 무한 스크롤 구현 | - |
| 2024-12-27 | 찜하기 기능 구현 | - |
| 2024-12-27 | 인플루언서 탐색 페이지 추가 | - |
| 2024-12-27 | 실시간 업데이트 구현 | - |

---

**문서 버전**: 1.0  
**최종 업데이트**: 2024년 12월 27일

