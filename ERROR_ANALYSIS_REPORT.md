# 프로젝트 전체 에러 분석 보고서

## 1. 401 Unauthorized 에러 가능성

### 1.1 API 엔드포인트 (인증 필요)

다음 엔드포인트들은 `verifyAuth` 또는 `requireRole`을 사용하므로, 인증 토큰이 없거나 만료되면 401 에러가 발생합니다.

#### 인증이 필요한 API 엔드포인트 목록:

1. **`/api/campaigns` (GET, POST)**
   - 파일: `src/app/api/campaigns/route.ts`
   - GET: `verifyAuth` 필요
   - POST: `requireRole(['advertiser'])` 필요
   - 사용 위치:
     - `src/contexts/CampaignContext.tsx:241` - `fetchMyCampaigns` (GET)
     - `src/contexts/CampaignContext.tsx:294` - `addCampaign` (POST)
     - `src/app/advertiser/campaigns/page.tsx:31` (GET)
     - `src/app/advertiser/feed/page.tsx:58` (GET)
     - `src/app/admin/campaigns/page.tsx:31` (GET)
     - `src/components/campaigns/CampaignsList.tsx:57` (GET)

2. **`/api/campaigns/open` (GET)**
   - 파일: `src/app/api/campaigns/open/route.ts`
   - 인증: `requireRole(['influencer'])` 필요
   - ⚠️ 복합 인덱스 필요: `status + openedAt`

3. **`/api/campaigns/latest` (GET)**
   - 파일: `src/app/api/campaigns/latest/route.ts`
   - 인증: 불필요 (공개 API)
   - ⚠️ 타입 불일치 문제 (500 에러 가능)

4. **`/api/campaigns/[id]` (GET)**
   - 파일: `src/app/api/campaigns/[id]/route.ts`
   - 인증: `verifyAuth` 필요
   - 사용 위치: `src/app/campaigns/[id]/page.tsx:140`

5. **`/api/campaigns/[id]/applications` (GET, POST)**
   - 파일: `src/app/api/campaigns/[id]/applications/route.ts`
   - 인증: `verifyAuth` 또는 `requireRole` 필요

6. **`/api/campaigns/[id]/submissions` (GET, POST)**
   - 파일: `src/app/api/campaigns/[id]/submissions/route.ts`
   - 인증: `verifyAuth` 또는 `requireRole` 필요
   - ⚠️ 복합 인덱스 가능성: `influencerId + status` (서브컬렉션)

7. **`/api/campaigns/[id]/approve` (POST)**
   - 파일: `src/app/api/campaigns/[id]/approve/route.ts`
   - 인증: `requireRole(['admin'])` 필요

8. **`/api/auth/me` (GET)**
   - 파일: `src/app/api/auth/me/route.ts`
   - 인증: `verifyAuth` 필요
   - 사용 위치: 여러 곳 (AuthContext, 여러 페이지)

9. **`/api/auth/signup` (POST)**
   - 파일: `src/app/api/auth/signup/route.ts`
   - 인증: `verifyAuth(requireUserDocument: false)` 필요
   - 사용 위치: `src/app/auth/signup/page.tsx:37`

10. **`/api/influencers` (GET)**
    - 파일: `src/app/api/influencers/route.ts`
    - 인증: `requireRole(['advertiser', 'admin'])` 필요
    - ⚠️ 복합 인덱스 필요: `role + createdAt` (users 컬렉션)

11. **`/api/admin/stats` (GET)**
    - 파일: `src/app/api/admin/stats/route.ts`
    - 인증: `requireRole(['admin'])` 필요
    - 사용 위치: `src/app/admin/dashboard/page.tsx:39`
    - ⚠️ 복합 인덱스 필요: `status + deadlineDate` (campaigns 컬렉션)

12. **`/api/admin/contracts` (GET)**
    - 파일: `src/app/api/admin/contracts/route.ts`
    - 인증: `requireRole(['admin'])` 필요
    - 사용 위치: `src/app/admin/contracts/page.tsx:45`
    - ✅ API 엔드포인트 생성 완료

13. **`/api/favorites` (GET, POST)**
    - 파일: `src/app/api/favorites/route.ts`
    - 인증: `verifyAuth` 필요

14. **`/api/favorites/check` (GET)**
    - 파일: `src/app/api/favorites/check/route.ts`
    - 인증: `verifyAuth` 필요

15. **`/api/storage/upload` (POST)**
    - 파일: `src/app/api/storage/upload/route.ts`
    - 인증: `verifyAuth` 필요

16. **`/api/campaigns/generate` (POST)**
    - 파일: `src/app/api/campaigns/generate/route.ts`
    - 인증: `requireRole(['advertiser'])` 필요

### 1.2 클라이언트 측 API 호출

모든 클라이언트 측 API 호출은 적절한 Authorization 헤더를 포함하고 있습니다. 하지만 토큰이 만료되면 401 에러가 발생할 수 있습니다.

---

## 2. 500 Internal Server Error 가능성

### 2.1 Firestore 복합 인덱스 문제 (500 에러)

다음 쿼리들은 복합 인덱스가 필요하므로, 인덱스가 없으면 500 에러가 발생합니다:

1. **`/api/campaigns` (GET) - advertiser 역할**
   - 파일: `src/app/api/campaigns/route.ts:39`
   - 쿼리: `.where('advertiserId', '==', user.uid).orderBy('createdAt', 'desc')`
   - ⚠️ 복합 인덱스 필요: `advertiserId (Ascending) + createdAt (Descending)`
   - 현재 상태: ✅ 메모리에서 정렬하도록 수정됨 (임시 해결)
   - 권장: Firebase Console에서 인덱스 생성

2. **`/api/campaigns` (GET) - influencer 역할**
   - 파일: `src/app/api/campaigns/route.ts:43`
   - 쿼리: `.where('status', '==', 'OPEN').orderBy('createdAt', 'desc')`
   - ⚠️ 복합 인덱스 필요: `status (Ascending) + createdAt (Descending)`
   - 현재 상태: ❌ 인덱스 필요 (에러 가능)

3. **`/api/campaigns/open` (GET)**
   - 파일: `src/app/api/campaigns/open/route.ts:16`
   - 쿼리: `.where('status', '==', 'OPEN').orderBy('openedAt', 'desc')`
   - ⚠️ 복합 인덱스 필요: `status (Ascending) + openedAt (Descending)`
   - 현재 상태: ❌ 인덱스 필요 (에러 가능)

4. **`/api/influencers` (GET)**
   - 파일: `src/app/api/influencers/route.ts:18`
   - 쿼리: `.where('role', '==', 'influencer').orderBy('createdAt', 'desc')`
   - ⚠️ 복합 인덱스 필요: `role (Ascending) + createdAt (Descending)` (users 컬렉션)
   - 현재 상태: ❌ 인덱스 필요 (에러 가능)

5. **`/api/admin/stats` (GET)**
   - 파일: `src/app/api/admin/stats/route.ts:32`
   - 쿼리: `.where('status', '==', 'RUNNING').where('deadlineDate', '<', now)`
   - ⚠️ 복합 인덱스 필요: `status (Ascending) + deadlineDate (Ascending)`
   - 현재 상태: ❌ 인덱스 필요 (에러 가능)

6. **`/api/cron/overdue-detection` (GET)**
   - 파일: `src/app/api/cron/overdue-detection/route.ts:21`
   - 쿼리: `.where('status', 'in', ['RUNNING', 'MATCHING']).where('deadlineDate', '<', now)`
   - ⚠️ 복합 인덱스 필요: `status + deadlineDate`
   - 현재 상태: ❌ 인덱스 필요 (에러 가능)

7. **`/api/cron/status-transition` (GET)**
   - 파일: `src/app/api/cron/status-transition/route.ts:22`
   - 쿼리: `.where('status', '==', 'APPROVED').where('approvedAt', '<=', oneDayAgo)`
   - ⚠️ 복합 인덱스 필요: `status (Ascending) + approvedAt (Ascending)`
   - 현재 상태: ❌ 인덱스 필요 (에러 가능)

8. **`/api/cron/status-transition` (GET) - RUNNING → COMPLETED**
   - 파일: `src/app/api/cron/status-transition/route.ts:50`
   - 쿼리: `.where('status', '==', 'RUNNING').where('deadlineDate', '<', now)`
   - ⚠️ 복합 인덱스 필요: `status (Ascending) + deadlineDate (Ascending)`
   - 현재 상태: ❌ 인덱스 필요 (에러 가능)

9. **`/api/cron/deadline-reminder` (GET)**
   - 파일: `src/app/api/cron/deadline-reminder/route.ts:25`
   - 쿼리: `.where('status', 'in', ['RUNNING', 'MATCHING']).where('deadlineDate', '>=', tomorrow).where('deadlineDate', '<=', tomorrowEnd)`
   - ⚠️ 복합 인덱스 필요: `status + deadlineDate`
   - 현재 상태: ❌ 인덱스 필요 (에러 가능)

10. **`/api/campaigns/[id]/submissions` (POST)**
    - 파일: `src/app/api/campaigns/[id]/submissions/route.ts:94`
    - 쿼리: `.where('influencerId', '==', user.uid).where('status', '==', 'SELECTED')`
    - ⚠️ 복합 인덱스 필요: `influencerId + status` (applications 서브컬렉션)
    - 현재 상태: ❌ 인덱스 필요 (에러 가능)

### 2.2 데이터 변환 및 타입 불일치 문제 (500 에러)

1. **`/api/campaigns/latest` (GET) - 타입 불일치**
   - 파일: `src/app/api/campaigns/latest/route.ts`
   - 반환 형식: `MainCampaign[]`
   - 문제: `transformCampaign` 함수가 `CampaignListItem` 형식 기대
   - 위치: `src/contexts/CampaignContext.tsx:192, 218`
   - 현재 상태: ✅ 타입 불일치 수정 완료 (`transformMainCampaign` 함수 추가)
   - 수정: `transformMainCampaign` 함수를 추가하여 `MainCampaign` 타입을 `CampaignListItem`으로 변환

2. **타임스탬프 변환 에러**
   - 여러 API에서 `toDate()` 호출 시 null 체크는 있지만, 예외 처리 부족
   - 위치: 여러 파일

3. **specJson 가져오기 실패**
   - 파일: `src/app/api/campaigns/latest/route.ts:33-42`
   - `currentSpecVersionId`가 있지만 spec 문서가 없는 경우
   - 현재 상태: ⚠️ null 체크는 있지만 에러 가능

4. **null/undefined 접근**
   - 여러 곳에서 optional chaining 사용하지만, 런타임 에러 가능성

### 2.3 기타 500 에러 가능성

1. **Firebase 환경 변수 미설정**
   - `.env.local` 파일의 필수 변수 누락
   - Firebase Admin SDK 초기화 실패

2. **Firestore 권한 문제**
   - Firestore 보안 규칙 문제
   - 권한 부족으로 인한 읽기/쓰기 실패

---

## 3. 필요한 Firestore 복합 인덱스 목록

### campaigns 컬렉션:
1. `advertiserId (Ascending) + createdAt (Descending)`
2. `status (Ascending) + createdAt (Descending)`
3. `status (Ascending) + openedAt (Descending)`
4. `status (Ascending) + deadlineDate (Ascending)`
5. `status (Ascending) + approvedAt (Ascending)`

### users 컬렉션:
1. `role (Ascending) + createdAt (Descending)`

### campaigns/{campaignId}/applications 서브컬렉션:
1. `influencerId (Ascending) + status (Ascending)`

### campaigns/{campaignId}/submissions 서브컬렉션:
1. `influencerId (Ascending) + status (Ascending)`

---

## 4. 조치 사항 구분

### 🛠️ 제가 수정할 수 있는 부분 (코드 수정)

#### 우선순위 1 (즉시 수정 가능)
1. ✅ `/api/campaigns` (GET) - advertiser 역할: 메모리 정렬로 임시 해결됨
2. ✅ `/api/admin/contracts` 엔드포인트 생성 완료
   - 파일: `src/app/api/admin/contracts/route.ts` (신규 생성 완료)
   - 인증: `requireRole(['admin'])` 필요
   - 사용 위치: `src/app/admin/contracts/page.tsx:45`
   - 상태: ✅ API 엔드포인트 생성 완료

3. ✅ `/api/campaigns/latest` - 타입 불일치 수정 완료
   - 문제: `MainCampaign[]` 반환 vs `CampaignListItem` 기대
   - 위치: `src/contexts/CampaignContext.tsx:192, 218`
   - 해결: ✅ `transformMainCampaign` 함수 추가하여 타입 변환 처리

#### 우선순위 2 (코드 개선 가능)
1. 타임스탬프 변환 에러 처리 개선
   - 여러 API에서 `toDate()` 호출 시 예외 처리 추가
   - 위치: `src/app/api/campaigns/open/route.ts`, `src/app/api/influencers/route.ts` 등

2. 클라이언트 측 에러 처리 개선
   - API 호출 시 응답 상태 코드 확인 추가
   - 에러 메시지 개선

3. null/undefined 접근 방어 코드 추가
   - optional chaining 보강

---

### 👤 사용자가 직접 해야 하는 부분 (Firebase 설정)

---

## 📋 Firebase Console 인덱스 생성 가이드

### 단계 1: Firebase Console 접속

1. 웹 브라우저에서 **Firebase Console** 접속
   - URL: https://console.firebase.google.com
   - 또는 Google 검색: "Firebase Console"

2. **Google 계정으로 로그인** (프로젝트에 접근 권한이 있는 계정)

3. 프로젝트 목록에서 **프로젝트 선택**
   - 프로젝트 ID: `nextcarrot-195ac` (또는 사용 중인 프로젝트 ID)

---

### 단계 2: Firestore 인덱스 페이지 접속

1. 왼쪽 메뉴에서 **"Firestore Database"** (Firestore 데이터베이스) 클릭
   - 아이콘: 데이터베이스 모양

2. 상단 탭에서 **"Indexes"** (인덱스) 탭 클릭
   - "Data" (데이터), "Indexes" (인덱스), "Usage" (사용량) 탭 중 "Indexes" (인덱스) 선택

3. **"Create Index"** (인덱스 생성) 버튼 클릭
   - 오른쪽 상단에 있는 파란색 버튼

---

### 단계 3: 각 인덱스 생성 (총 9개)

#### 인덱스 1: campaigns 컬렉션 - status + openedAt

**사용 위치:** `/api/campaigns/open`  
**에러:** 500 Internal Server Error (INDEX_REQUIRED)

**생성 방법:**
1. "Create Index" (인덱스 생성) 버튼 클릭
2. **Collection ID** (컬렉션 ID) 입력: `campaigns`
   - 정확히 `campaigns` (소문자, 복수형)
3. **Query scope** (쿼리 범위) 선택: `Collection` (컬렉션) (기본값)
4. **Fields** (필드) 추가:
   - 첫 번째 필드:
     - **Field path** (필드 경로): `status`
     - **Order** (정렬): `Ascending` (오름차순)
     - "Add field" (필드 추가) 클릭
   - 두 번째 필드:
     - **Field path** (필드 경로): `openedAt`
     - **Order** (정렬): `Descending` (내림차순)
5. **"Create"** (생성) 버튼 클릭
6. 인덱스 생성 완료 대기 (상태가 "Building" (생성 중) → "Enabled" (활성화됨)로 변경될 때까지, 보통 1-5분)

---

#### 인덱스 2: campaigns 컬렉션 - status + createdAt

**사용 위치:** `/api/campaigns` (influencer 역할)  
**에러:** 500 Internal Server Error (INDEX_REQUIRED)

**생성 방법:**
1. "Create Index" (인덱스 생성) 버튼 클릭
2. **Collection ID** (컬렉션 ID) 입력: `campaigns`
3. **Query scope** (쿼리 범위) 선택: `Collection` (컬렉션)
4. **Fields** (필드) 추가:
   - 첫 번째 필드:
     - **Field path** (필드 경로): `status`
     - **Order** (정렬): `Ascending` (오름차순)
   - 두 번째 필드:
     - **Field path** (필드 경로): `createdAt`
     - **Order** (정렬): `Descending` (내림차순)
5. **"Create"** (생성) 버튼 클릭

---

#### 인덱스 3: campaigns 컬렉션 - status + deadlineDate

**사용 위치:** `/api/admin/stats`, `/api/cron/overdue-detection`, `/api/cron/status-transition`, `/api/cron/deadline-reminder`  
**에러:** 500 Internal Server Error (INDEX_REQUIRED)  
**⚠️ 중요:** 여러 API에서 사용되는 필수 인덱스

**생성 방법:**
1. "Create Index" (인덱스 생성) 버튼 클릭
2. **Collection ID** (컬렉션 ID) 입력: `campaigns`
3. **Query scope** (쿼리 범위) 선택: `Collection` (컬렉션)
4. **Fields** (필드) 추가:
   - 첫 번째 필드:
     - **Field path** (필드 경로): `status`
     - **Order** (정렬): `Ascending` (오름차순)
   - 두 번째 필드:
     - **Field path** (필드 경로): `deadlineDate`
     - **Order** (정렬): `Ascending` (오름차순)
5. **"Create"** (생성) 버튼 클릭

---

#### 인덱스 4: campaigns 컬렉션 - status + approvedAt

**사용 위치:** `/api/cron/status-transition`  
**에러:** 500 Internal Server Error (INDEX_REQUIRED)

**생성 방법:**
1. "Create Index" (인덱스 생성) 버튼 클릭
2. **Collection ID** (컬렉션 ID) 입력: `campaigns`
3. **Query scope** (쿼리 범위) 선택: `Collection` (컬렉션)
4. **Fields** (필드) 추가:
   - 첫 번째 필드:
     - **Field path** (필드 경로): `status`
     - **Order** (정렬): `Ascending` (오름차순)
   - 두 번째 필드:
     - **Field path** (필드 경로): `approvedAt`
     - **Order** (정렬): `Ascending` (오름차순)
5. **"Create"** (생성) 버튼 클릭

---

#### 인덱스 5: campaigns 컬렉션 - advertiserId + createdAt (선택사항)

**사용 위치:** `/api/campaigns` (advertiser 역할)  
**현재 상태:** 메모리 정렬로 임시 해결됨  
**권장:** 성능 향상을 위해 생성 권장 (에러는 발생하지 않지만 속도가 느릴 수 있음)

**생성 방법:**
1. "Create Index" (인덱스 생성) 버튼 클릭
2. **Collection ID** (컬렉션 ID) 입력: `campaigns`
3. **Query scope** (쿼리 범위) 선택: `Collection` (컬렉션)
4. **Fields** (필드) 추가:
   - 첫 번째 필드:
     - **Field path** (필드 경로): `advertiserId`
     - **Order** (정렬): `Ascending` (오름차순)
   - 두 번째 필드:
     - **Field path** (필드 경로): `createdAt`
     - **Order** (정렬): `Descending` (내림차순)
5. **"Create"** (생성) 버튼 클릭

---

#### 인덱스 6: users 컬렉션 - role + createdAt

**사용 위치:** `/api/influencers`  
**에러:** 500 Internal Server Error (INDEX_REQUIRED)

**생성 방법:**
1. "Create Index" (인덱스 생성) 버튼 클릭
2. **Collection ID** (컬렉션 ID) 입력: `users`
   - ⚠️ 주의: `campaigns`가 아닌 `users`
3. **Query scope** (쿼리 범위) 선택: `Collection` (컬렉션)
4. **Fields** (필드) 추가:
   - 첫 번째 필드:
     - **Field path** (필드 경로): `role`
     - **Order** (정렬): `Ascending` (오름차순)
   - 두 번째 필드:
     - **Field path** (필드 경로): `createdAt`
     - **Order** (정렬): `Descending` (내림차순)
5. **"Create"** (생성) 버튼 클릭

---

#### 인덱스 7: campaigns/{campaignId}/applications 서브컬렉션 - influencerId + status

**사용 위치:** `/api/campaigns/[id]/submissions` (POST)  
**에러:** 500 Internal Server Error (INDEX_REQUIRED)  
**⚠️ 중요:** 서브컬렉션이므로 Collection Group 인덱스 필요

**생성 방법:**
1. "Create Index" (인덱스 생성) 버튼 클릭
2. **Collection ID** (컬렉션 ID) 입력: `applications`
   - ⚠️ 주의: `campaigns`가 아닌 `applications` (서브컬렉션 이름만)
3. **Query scope** (쿼리 범위) 선택: `Collection group` (컬렉션 그룹)
   - ⚠️ 중요: 반드시 "Collection group" (컬렉션 그룹) 선택해야 함 (서브컬렉션이므로)
4. **Fields** (필드) 추가:
   - 첫 번째 필드:
     - **Field path** (필드 경로): `influencerId`
     - **Order** (정렬): `Ascending` (오름차순)
   - 두 번째 필드:
     - **Field path** (필드 경로): `status`
     - **Order** (정렬): `Ascending` (오름차순)
5. **"Create"** (생성) 버튼 클릭

---

#### 인덱스 8: campaigns/{campaignId}/submissions 서브컬렉션 - influencerId + status (예비, 선택사항)

**사용 위치:** (현재 사용되지 않지만 향후 필요할 수 있음)  
**상태:** 예비 인덱스 (필요 시 생성, 현재는 생성하지 않아도 됨)

**생성 방법:**
1. "Create Index" (인덱스 생성) 버튼 클릭
2. **Collection ID** (컬렉션 ID) 입력: `submissions`
3. **Query scope** (쿼리 범위) 선택: `Collection group` (컬렉션 그룹)
4. **Fields** (필드) 추가:
   - 첫 번째 필드:
     - **Field path** (필드 경로): `influencerId`
     - **Order** (정렬): `Ascending` (오름차순)
   - 두 번째 필드:
     - **Field path** (필드 경로): `status`
     - **Order** (정렬): `Ascending` (오름차순)
5. **"Create"** (생성) 버튼 클릭

---

### 단계 4: 인덱스 생성 확인

1. **Indexes** (인덱스) 탭에서 생성한 인덱스 목록 확인
2. 각 인덱스의 **Status** (상태) 확인:
   - **"Building"** (생성 중): 아직 생성 중 (대기 필요)
   - **"Enabled"** (활성화됨): 생성 완료 (사용 가능)
   - **"Error"** (오류): 오류 발생 (필드명 등 확인 필요)
3. 모든 인덱스가 **"Enabled"** (활성화됨) 상태가 되면 완료

---

### ⚠️ 주의사항

1. **필드명 정확히 입력**
   - 대소문자 구분: `status` (소문자), `createdAt` (camelCase)
   - 오타 주의: `openedAt`, `deadlineDate`, `approvedAt` 등

2. **정렬 방향 확인**
   - Ascending (오름차순): 오름차순 (A → Z, 1 → 9)
   - Descending (내림차순): 내림차순 (Z → A, 9 → 1)
   - 보고서에 명시된 방향 그대로 입력

3. **서브컬렉션 인덱스**
   - `applications`, `submissions` 서브컬렉션은 **"Collection group"** (컬렉션 그룹) 선택 필수
   - 그 외 컬렉션은 **"Collection"** (컬렉션) 선택

4. **인덱스 생성 시간**
   - 보통 1-5분 소요
   - 데이터가 많을수록 더 오래 걸릴 수 있음
   - "Building" (생성 중) 상태일 때는 해당 쿼리 사용 불가

5. **에러 발생 시 자동 링크 활용**
   - API 호출 시 인덱스가 없으면 에러 메시지에 Firebase Console 링크 제공
   - 링크 클릭 시 자동으로 인덱스 생성 폼이 채워짐
   - 해당 링크 사용하는 것이 가장 안전함

---

### 🔄 빠른 방법: 에러 메시지 링크 사용

1. 애플리케이션 실행 후 인덱스가 필요한 API 호출
2. 브라우저 개발자 도구의 Network (네트워크) 탭에서 500 에러 확인
3. 에러 응답 본문에서 Firebase Console 링크 확인
   - 예: `https://console.firebase.google.com/v1/r/project/.../firestore/indexes?create_composite=...`
4. 링크 클릭 → 자동으로 인덱스 정보가 채워진 페이지 열림
5. "Create Index" (인덱스 생성) 버튼 클릭

---

## 📋 Firebase 환경 변수 확인 (선택사항)

### .env.local 파일 확인

1. 프로젝트 루트 디렉토리에서 `.env.local` 파일 열기
2. 다음 변수들이 설정되어 있는지 확인:

```
# Firebase Admin SDK 필수 변수 (예시)
FIREBASE_PROJECT_ID=nextcarrot-195ac
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@nextcarrot-195ac.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

3. 변수가 없거나 잘못된 경우:
   - Firebase Console → 프로젝트 설정 (Project Settings) → 서비스 계정 (Service accounts)
   - "새 비공개 키 생성" (Generate new private key) 클릭하여 JSON 파일 다운로드
   - JSON 파일 내용을 환경 변수로 변환하여 `.env.local`에 추가

---

## 📋 Firestore 보안 규칙 확인 (선택사항)

1. Firebase Console → Firestore Database (Firestore 데이터베이스) → Rules (규칙) 탭
2. 현재 규칙 확인 (서버 측 Admin SDK는 규칙을 우회하지만, 클라이언트 측에서 사용할 경우 필요)
3. 문제 없으면 수정 불필요

---

## ✅ 체크리스트

인덱스 생성 후 다음 항목 확인:

- [ ] campaigns 컬렉션 - status + openedAt (내림차순) 인덱스 생성 완료
- [ ] campaigns 컬렉션 - status + createdAt (내림차순) 인덱스 생성 완료
- [ ] campaigns 컬렉션 - status + deadlineDate (오름차순) 인덱스 생성 완료
- [ ] campaigns 컬렉션 - status + approvedAt (오름차순) 인덱스 생성 완료
- [ ] campaigns 컬렉션 - advertiserId + createdAt (내림차순) 인덱스 생성 완료 (선택사항, 성능 향상용)
- [ ] users 컬렉션 - role + createdAt (내림차순) 인덱스 생성 완료
- [ ] applications 서브컬렉션 (컬렉션 그룹) - influencerId + status (오름차순) 인덱스 생성 완료
- [ ] 모든 인덱스 상태가 "Enabled" (활성화됨)로 변경됨
- [ ] 애플리케이션 재시작 후 API 호출 테스트
- [ ] 500 에러가 더 이상 발생하지 않음

---

## 5. 작업 계획

### 즉시 실행 (제가 처리)
1. ✅ `/api/campaigns` (GET) - advertiser 역할 메모리 정렬 적용 완료
2. ✅ `/api/admin/contracts` 엔드포인트 생성 완료
3. ✅ `/api/campaigns/latest` 타입 불일치 수정 완료

### 사용자 작업 (Firebase Console)
1. ❌ Firestore 복합 인덱스 생성 (필수 7개 + 선택 2개 = 총 9개)
   - campaigns 컬렉션: 필수 4개 + 선택 1개 (성능 향상용)
   - users 컬렉션: 필수 1개
   - applications 서브컬렉션: 필수 1개
   - submissions 서브컬렉션: 선택 1개 (예비, 현재는 생성하지 않아도 됨)

### 후속 작업 (선택사항)
1. 타임스탬프 변환 에러 처리 개선
2. 클라이언트 측 에러 처리 개선
3. 환경 변수 및 보안 규칙 점검


