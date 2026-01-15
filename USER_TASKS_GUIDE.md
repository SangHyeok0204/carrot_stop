# 사용자 작업 가이드

> **AI가 구현 가능한 모든 작업은 완료되었습니다.**  
> 이 문서는 사용자가 직접 수행해야 하는 작업을 단계별로 상세히 안내합니다.

**작성일**: 2025-01-27  
**예상 총 소요 시간**: 약 6-8시간

---

## 📋 작업 목록 요약

### 🟡 중간 우선순위 (1주일 내 권장)
1. **데이터베이스 스키마 확인** (30분)
2. **API 응답 검증** (1시간)
3. **데이터 마이그레이션 실행** (1시간)

### 🟢 낮은 우선순위 (향후)
4. **Firestore 인덱스 생성** (30분)
5. **이메일 발송 서비스 설정** (30분)
6. **데이터 백업 전략 수립** (1-2시간)

---

## 1️⃣ 데이터베이스 스키마 확인

### 목적
기존 데이터에 필요한 필드가 있는지 확인하고, 없으면 마이그레이션이 필요한지 판단합니다.

### 왜 필요한가요?
프론트엔드와 API가 기대하는 필드가 데이터베이스에 없으면 다음과 같은 문제가 발생합니다:

1. **`category` 필드 없음**:
   - ❌ 캠페인 카드에서 카테고리별 색상/아이콘 표시 불가
   - ❌ 인플루언서가 카테고리로 필터링 불가
   - ❌ 메인 페이지에서 "카페", "음식점" 등 카테고리 표시 불가
   - 📍 **사용 위치**: `src/components/shared/CampaignCard.tsx` (라인 36-47), `src/app/api/campaigns/latest/route.ts` (라인 94-96)

2. **`applicationsCount` 필드 없음**:
   - ❌ 캠페인 카드에서 "지원자 5명" 같은 정보 표시 불가
   - ❌ 매번 서브컬렉션을 조회해야 해서 성능 저하 (현재는 매번 계산 중)
   - 📍 **사용 위치**: `src/app/api/campaigns/latest/route.ts` (라인 62-71, 116), `src/app/advertiser/feed/page.tsx` (라인 16)

3. **`imageUrl` 필드 없음**:
   - ❌ 캠페인 썸네일 이미지 표시 불가
   - ❌ 이미지 업로드 기능이 작동하지 않음
   - 📍 **사용 위치**: `src/components/shared/CampaignCard.tsx` (이미지 표시), `src/app/api/campaigns/[id]/route.ts` (라인 64)

4. **`profile.platforms` 필드 없음**:
   - ❌ 인플루언서 프로필에서 플랫폼 정보 표시 불가
   - ❌ 광고주가 플랫폼별로 인플루언서 검색 불가
   - 📍 **사용 위치**: `src/app/api/influencers/route.ts` (라인 14, 22-25), 인플루언서 프로필 페이지

5. **`displayName` 필드 없음**:
   - ❌ 캠페인 카드에서 "작성자: (없음)" 표시
   - ❌ 프로필 페이지에서 이름 표시 불가
   - ❌ 네비게이션 바에서 사용자 이름 표시 불가
   - 📍 **사용 위치**: `src/components/shared/TopNav.tsx`, `src/components/mypage/ProfileCard.tsx`, 모든 프로필 관련 컴포넌트

6. **`profile.companyName` 필드 없음** (광고주용):
   - ❌ 광고주 프로필에서 회사명 표시 불가
   - ❌ 캠페인 상세 페이지에서 광고주 이름이 회사명 대신 개인 이름으로 표시
   - 📍 **사용 위치**: `src/app/api/campaigns/[id]/route.ts` (라인 56), `src/app/advertiser/dashboard/page.tsx`

7. **`profile.nickname` 필드 없음** (인플루언서용):
   - ❌ 인플루언서 프로필에서 활동명 표시 불가
   - ❌ `displayName` 대신 `nickname`을 우선 표시하는 로직이 작동하지 않음
   - 📍 **사용 위치**: `src/components/mypage/ProfileCard.tsx` (라인 70-72)

8. **`profile.followerCount` 필드 없음** (인플루언서용):
   - ❌ 인플루언서 프로필에서 팔로워 수 표시 불가
   - ❌ 광고주가 팔로워 수로 인플루언서를 필터링 불가
   - 📍 **사용 위치**: 인플루언서 프로필 페이지, 인사이트 페이지

**결과**: 이 필드들이 없으면 UI가 깨지거나, 매번 서브컬렉션을 조회해야 해서 성능이 크게 저하됩니다.

### 단계별 가이드

#### 1.1 Firebase 콘솔 접속
1. 웹 브라우저에서 [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 선택 (또는 새로 생성)
3. 좌측 메뉴에서 **"Firestore Database"** 클릭

#### 1.2 캠페인 문서 확인
1. Firestore Database 페이지에서 **"campaigns"** 컬렉션 클릭
2. 첫 번째 문서를 열어서 다음 필드가 있는지 확인:

   **필수 확인 필드** (마이그레이션 대상):
   - `imageUrl` (string, optional) - 캠페인 썸네일 이미지 URL
   - `category` (string, optional) - 카테고리 (예: "카페", "음식점" 등)
   - `applicationsCount` (number, optional) - 지원자 수

   **기본 필드** (이미 있어야 함):
   - `advertiserId` (string, required) - 광고주 ID
   - `status` (string, required) - 캠페인 상태 (GENERATED, APPROVED, OPEN, RUNNING 등)
   - `title` (string, required) - 캠페인 제목
   - `createdAt` (Timestamp, required) - 생성일
   - `updatedAt` (Timestamp, required) - 수정일
   - `openedAt` (Timestamp, optional) - 오픈일
   - `deadlineDate` (Timestamp, optional) - 마감일
   - `currentSpecVersionId` (string, optional) - 현재 스펙 버전 ID

3. **결과 기록**:
   - ✅ 모든 필수 필드가 있으면: 마이그레이션 불필요
   - ❌ 일부 필수 필드가 없으면: 마이그레이션 필요 (3번 작업으로 이동)

#### 1.3 사용자 문서 확인
1. **"users"** 컬렉션 클릭
2. 첫 번째 문서를 열어서 다음 필드가 있는지 확인:

   **필수 확인 필드** (마이그레이션 대상):
   - `displayName` (string, optional) - 표시 이름 (공통)
   - `companyName` (string, optional) - 회사명 (광고주용, 최상위 레벨)
   - `profile.platforms` (array, optional) - 플랫폼 배열 (인플루언서용, 예: ["Instagram", "YouTube"])
   - `profile.companyName` (string, optional) - 회사명 (광고주용, profile 객체 안)

   **기본 필드** (이미 있어야 함):
   - `email` (string, required) - 이메일 주소
   - `role` (string, required) - 역할 (advertiser, influencer, admin)
   - `createdAt` (Timestamp, required) - 생성일
   - `updatedAt` (Timestamp, required) - 수정일

   **프로필 필드** (선택사항, 있으면 좋음):
   - `profile.nickname` (string, optional) - 활동명/닉네임 (인플루언서용)
   - `profile.bio` (string, optional) - 소개글
   - `profile.followerCount` (number, optional) - 팔로워 수 (인플루언서용)
   - `profile.photoURL` (string, optional) - 프로필 사진 URL
   - `profile.instagramUrl` (string, optional) - Instagram 링크
   - `profile.youtubeUrl` (string, optional) - YouTube 링크
   - `profile.location` (string, optional) - 위치
   - `profile.websiteUrl` (string, optional) - 웹사이트 URL

3. **역할별 확인 사항**:
   - **광고주 (role === 'advertiser')**: `companyName` 또는 `profile.companyName` 확인
   - **인플루언서 (role === 'influencer')**: `profile.platforms` 확인

4. **결과 기록**:
   - ✅ 모든 필수 필드가 있으면: 마이그레이션 불필요
   - ❌ 일부 필수 필드가 없으면: 마이그레이션 필요 (3번 작업으로 이동)

#### 1.4 새 컬렉션 확인 (선택사항)
다음 컬렉션들이 자동 생성되었는지 확인 (데이터가 저장될 때 자동 생성됨):
- `portfolios` - 인플루언서 포트폴리오
- `reviews` - 캠페인 리뷰
- `surveys` - 설문 응답
- `contacts` - 문의 내역

**참고**: 컬렉션이 없어도 문제없습니다. 첫 데이터 저장 시 자동 생성됩니다.

---

## 2️⃣ API 응답 검증

### 목적
실제 API가 올바른 데이터를 반환하는지 확인하고, 누락된 필드가 있는지 검증합니다.

### 왜 필요한가요?
API 응답에 필드가 누락되면 프론트엔드에서 에러가 발생하거나 UI가 깨집니다:

1. **프론트엔드 에러 방지**:
   - `advertiserName` 없음 → 캠페인 카드에서 "작성자: (없음)" 표시
   - `category` 없음 → 카테고리 배지가 표시되지 않음
   - `imageUrl` 없음 → 이미지 placeholder만 표시
   - `applicationsCount` 없음 → "지원자 수" 표시 불가

2. **데이터 일관성 확인**:
   - 마이그레이션 후 실제로 필드가 추가되었는지 확인
   - API가 올바르게 데이터를 변환하는지 확인
   - 타입 불일치나 null 값 처리 확인

3. **사용자 경험 보장**:
   - 메인 페이지(`/`)에서 캠페인 목록이 정상 표시되는지 확인
   - 인플루언서 피드에서 필터링이 작동하는지 확인
   - 광고주 대시보드에서 캠페인 정보가 올바르게 표시되는지 확인

**결과**: API 검증을 하지 않으면 프로덕션에서 예상치 못한 에러가 발생할 수 있습니다.

### 사전 준비
- 개발 서버 실행: `npm run dev`
- 브라우저 개발자 도구 열기 (F12)

### 단계별 가이드

#### 2.1 개발 서버 실행
```bash
# 프로젝트 루트 디렉토리에서
npm run dev
```

서버가 `http://localhost:3000`에서 실행되는지 확인합니다.

#### 2.2 API 엔드포인트 테스트

##### 테스트 1: 최신 캠페인 목록 API
1. 브라우저에서 다음 URL 접속:
   ```
   http://localhost:3000/api/campaigns/latest?limit=5
   ```
2. 응답 JSON을 확인하고 다음 필드가 있는지 체크:
   - ✅ `success`: true
   - ✅ `data.campaigns[]`: 배열
   - ✅ 각 캠페인에 다음 필드 존재:
     - `id` (string) - 캠페인 ID
     - `title` (string) - 캠페인 제목
     - `advertiserName` (string) - 광고주 이름
     - `description` (string) - 캠페인 설명
     - `category` (string) - 카테고리
     - `imageUrl` (string 또는 null) - 이미지 URL
     - `applicationsCount` (number) - 지원자 수
     - `objective` (string) - 캠페인 목표 (인지도, 방문유도 등)
     - `budgetRange` (string) - 예산 범위 (10-30만, 50-100만 등)
     - `channel` (string) - 플랫폼 (Instagram, YouTube, TikTok)
     - `deadline` (string) - 마감일 (YYYY-MM-DD 형식)
     - `isHot` (boolean) - 마감 임박 여부

**예상 응답 형식**:
```json
{
  "success": true,
  "data": {
    "campaigns": [
      {
        "id": "campaign-id",
        "title": "캠페인 제목",
        "advertiserName": "광고주 이름",
        "description": "캠페인 설명",
        "category": "카페",
        "imageUrl": "https://...",
        "applicationsCount": 5,
        "objective": "인지도",
        "budgetRange": "10-30만",
        "channel": "Instagram",
        "deadline": "2025-02-15",
        "isHot": true
      }
    ],
    "stats": {
      "totalRecruiting": 10,
      "deadlineThisWeek": 3
    },
    "nextCursor": "campaign-id-2"
  }
}
```

##### 테스트 2: 인플루언서 캠페인 목록 API
1. 먼저 로그인 (인플루언서 계정)
2. 브라우저 개발자 도구 → Network 탭 열기
3. 인플루언서 마이페이지 접속: `http://localhost:3000/influencer/mypage`
4. Network 탭에서 `/api/influencers/[id]/campaigns` 요청 확인
5. 응답에 다음 필드가 있는지 확인:
   - ✅ `success`: true
   - ✅ `data.grouped.applied[]`: 지원한 캠페인 배열
   - ✅ `data.grouped.completed[]`: 완료한 캠페인 배열

##### 테스트 3: 문의 API (선택사항)
1. Contact 페이지 접속: `http://localhost:3000/contact`
2. 문의 폼 작성 및 제출
3. Firebase 콘솔에서 `contacts` 컬렉션에 데이터가 저장되었는지 확인

#### 2.3 문제 발견 시 대응
- **필드 누락**: `WORK_SUMMARY.md`의 해당 항목에 체크 표시하고, AI에게 수정 요청
- **에러 발생**: 에러 메시지를 복사하여 기록
- **빈 응답**: 데이터베이스에 실제 데이터가 있는지 확인

---

## 3️⃣ 데이터 마이그레이션 실행

### 목적
기존 데이터에 누락된 필드를 자동으로 추가합니다.

### 왜 필요한가요?
기존에 생성된 캠페인/사용자 데이터에는 새로 추가된 필드가 없습니다:

1. **기존 캠페인 데이터 문제**:
   - `category`: 없음 → `specJson.target_audience.interests[0]`에서 추출 필요
   - `applicationsCount`: 없음 → `applications` 서브컬렉션에서 계산 필요
   - `imageUrl`: 없음 → 새로 생성된 캠페인만 있음

2. **기존 사용자 데이터 문제**:
   - `profile.platforms`: 없음 → 인플루언서 프로필 편집 시 추가됨 (기존 사용자는 빈 배열)
   - `profile.companyName`: 없음 → 광고주 회사명 (기존 사용자는 수동 입력 필요)

3. **성능 최적화**:
   - `applicationsCount`를 매번 계산하면 → 캠페인 목록 조회 시마다 서브컬렉션 조회 필요 (느림)
   - 마이그레이션 후 → 문서에 저장된 값 사용 (빠름)

4. **데이터 일관성**:
   - 모든 캠페인이 동일한 스키마를 가지도록 보장
   - API가 항상 동일한 형식의 데이터를 반환하도록 보장

**결과**: 마이그레이션을 하지 않으면 기존 데이터를 사용하는 모든 기능이 제대로 작동하지 않습니다.

### 사전 준비
- ✅ 마이그레이션 스크립트 확인: `scripts/migrate-db.ts` (이미 작성됨)
- ⚠️ **중요**: 프로덕션 데이터는 반드시 백업 후 실행

### 단계별 가이드

#### 3.1 환경변수 확인
`.env.local` 파일에 다음 환경변수가 설정되어 있는지 확인:
```env
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

#### 3.2 데이터 백업 (프로덕션인 경우)
1. Firebase 콘솔 → Firestore Database
2. 좌측 상단 **"내보내기"** 클릭
3. 백업 위치 선택 (Cloud Storage 버킷)
4. 백업 시작 및 완료 대기

**참고**: 개발 환경에서는 백업 생략 가능

#### 3.3 마이그레이션 스크립트 실행
```bash
# 프로젝트 루트 디렉토리에서
npm run migrate
```

**실행 과정**:
1. 스크립트가 자동으로 다음 작업 수행:

   **캠페인 문서 마이그레이션**:
   - `category` 필드 추가: `specJson.target_audience.interests[0]`에서 추출하여 정규화
   - `applicationsCount` 필드 추가: `applications` 서브컬렉션의 문서 수 계산
   - `imageUrl` 필드: 마이그레이션 스크립트에서 처리하지 않음 (이미 있거나 새로 생성된 캠페인만)

   **사용자 문서 마이그레이션**:
   - `profile.platforms` 필드 추가: 인플루언서용, 기본값은 빈 배열 `[]`
   - `profile.companyName` 필드 추가: 광고주용, 최상위 레벨의 `companyName`이 있으면 복사
   - `displayName` 필드: 마이그레이션 스크립트에서 처리하지 않음 (이미 있거나 회원가입 시 설정)

2. 콘솔에 진행 상황이 출력됩니다:
   ```
   📦 캠페인 문서 마이그레이션 시작...
   총 10개의 캠페인 문서 발견
     [campaign-id-1] category 추가: 카페
     [campaign-id-1] applicationsCount 추가: 3
   ✅ 캠페인 마이그레이션 완료: 5개 업데이트, 5개 스킵, 0개 오류
   
   👥 사용자 문서 마이그레이션 시작...
   총 20개의 사용자 문서 발견
     [user-id-1] profile.platforms 추가: []
   ✅ 사용자 마이그레이션 완료: 8개 업데이트, 12개 스킵, 0개 오류
   ```

#### 3.4 마이그레이션 결과 검증
1. Firebase 콘솔에서 업데이트된 문서 확인:

   **캠페인 문서 (`campaigns` 컬렉션)**:
   - `category` 필드: 문자열 값 확인 (예: "카페", "음식점")
   - `applicationsCount` 필드: 숫자 값 확인 (예: 0, 5, 10)
   - `imageUrl` 필드: 있으면 좋지만 필수 아님

   **사용자 문서 (`users` 컬렉션)**:
   - `profile.platforms` 필드: 배열 확인 (인플루언서는 `[]` 또는 `["Instagram", "YouTube"]`)
   - `profile.companyName` 필드: 문자열 값 확인 (광고주만, 있으면 좋지만 필수 아님)
   - `displayName` 필드: 문자열 값 확인 (있으면 좋지만 필수 아님)

2. 데이터 검증 스크립트 실행:
   ```bash
   npm run validate
   ```
   
3. 검증 결과 확인:
   - ✅ 모든 검증 통과: 완료
   - ⚠️ 경고 발생: 경고 내용 확인 (대부분 문제없음)
   - ❌ 오류 발생: 오류 내용을 기록하고 AI에게 문의

#### 3.5 문제 발생 시 롤백
프로덕션에서 문제가 발생한 경우:
1. Firebase 콘솔 → Firestore Database
2. 좌측 상단 **"가져오기"** 클릭
3. 백업 파일 선택하여 복원

---

## 4️⃣ Firestore 인덱스 생성

### 목적
쿼리 성능을 향상시키고, 임시 필드(`_sortTime`)를 제거하기 위해 복합 인덱스를 생성합니다.

### 왜 필요한가요?
현재 코드는 성능 문제를 피하기 위해 임시 해결책을 사용하고 있습니다:

1. **현재 문제점** (`_sortTime` 임시 필드 사용):
   ```typescript
   // src/app/api/campaigns/latest/route.ts (라인 117, 123)
   _sortTime: sortTime, // 정렬용 임시 필드
   const sortedCampaigns = allCampaigns.sort((a, b) => b._sortTime - a._sortTime);
   ```
   - ❌ **모든 문서를 메모리로 가져온 후 정렬** → 데이터가 많아지면 느려짐
   - ❌ **불필요한 데이터 전송** → `_sortTime` 필드를 API 응답에 포함했다가 제거
   - ❌ **Firestore 인덱스 미사용** → 데이터베이스 레벨에서 정렬 불가

2. **인덱스 생성 후 개선**:
   ```typescript
   // 인덱스 생성 후 가능한 코드
   query = db.collection('campaigns')
     .where('status', '==', 'OPEN')
     .orderBy('openedAt', 'desc')  // ← 인덱스 사용, 빠름!
     .limit(10);
   ```
   - ✅ **데이터베이스에서 정렬** → 필요한 데이터만 가져옴
   - ✅ **페이지네이션 효율적** → cursor 기반 페이지네이션 정확히 작동
   - ✅ **확장성** → 데이터가 10만 개여도 빠름

3. **필요한 인덱스**:
   - `status + openedAt (desc)`: 메인 페이지 최신 캠페인 조회
   - `advertiserId + createdAt (desc)`: 광고주 캠페인 목록 조회

**결과**: 인덱스를 생성하지 않으면 데이터가 많아질수록 API 응답이 느려지고, 서버 비용이 증가합니다.

### 단계별 가이드

#### 4.1 Firebase 콘솔 접속
1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 선택
3. 좌측 메뉴에서 **"Firestore Database"** 클릭
4. 상단 탭에서 **"인덱스"** 클릭

#### 4.2 인덱스 1 생성: 캠페인 상태 + 오픈일
1. **"인덱스 만들기"** 버튼 클릭
2. 컬렉션 ID: `campaigns` 입력
3. 필드 추가:
   - 필드 1: `status` (오름차순)
   - 필드 2: `openedAt` (내림차순)
4. **"만들기"** 클릭
5. 인덱스 생성 완료 대기 (보통 1-5분)

#### 4.3 인덱스 2 생성: 캠페인 광고주 + 생성일
1. **"인덱스 만들기"** 버튼 클릭
2. 컬렉션 ID: `campaigns` 입력
3. 필드 추가:
   - 필드 1: `advertiserId` (오름차순)
   - 필드 2: `createdAt` (내림차순)
4. **"만들기"** 클릭
5. 인덱스 생성 완료 대기

#### 4.4 인덱스 생성 확인
1. 인덱스 목록에서 두 인덱스가 **"사용 가능"** 상태인지 확인
2. 상태가 **"빌드 중"**이면 완료될 때까지 대기

#### 4.5 코드 업데이트 (AI가 준비한 코드 적용)
인덱스 생성이 완료되면:

1. `src/app/api/campaigns/route.ts.after-index` 파일 내용 확인
2. `src/app/api/campaigns/route.ts` 파일에 적용:
   - `_sortTime` 필드 제거
   - `orderBy` 직접 사용하도록 수정

3. `src/app/api/campaigns/latest/route.ts.after-index` 파일 내용 확인
4. `src/app/api/campaigns/latest/route.ts` 파일에 적용:
   - `_sortTime` 필드 제거
   - `orderBy` 직접 사용하도록 수정

**참고**: `.after-index` 파일은 참고용입니다. 실제로는 해당 파일의 내용을 원본 파일에 수동으로 적용해야 합니다.

#### 4.6 테스트
1. 개발 서버 재시작: `npm run dev`
2. API 테스트 (2번 작업 참고)
3. 응답이 정상적으로 오는지 확인

---

## 5️⃣ 이메일 발송 서비스 설정

### 목적
문의 접수 시 관리자에게 알림 이메일을 발송하고, 사용자에게 확인 이메일을 발송합니다.

### 왜 필요한가요?
문의 기능이 작동하지만, 이메일 알림이 없으면 문제가 발생합니다:

1. **현재 상태**:
   ```typescript
   // src/app/api/contact/route.ts
   // 문의는 데이터베이스에 저장되지만...
   await createContact({ name, email, message });
   
   // 이메일 발송 시도 (하지만 API 키가 없으면 실패)
   await sendContactNotificationToAdmin(contact);
   ```

2. **이메일 없을 때 문제**:
   - ❌ **관리자가 문의를 놓침** → Firebase 콘솔을 직접 확인해야 함
   - ❌ **사용자 불안** → "문의가 제대로 접수되었나?" 확인 불가
   - ❌ **응답 지연** → 관리자가 문의를 늦게 발견

3. **이메일 설정 후 개선**:
   - ✅ **관리자 즉시 알림** → 문의 접수 즉시 이메일 수신
   - ✅ **사용자 확인 이메일** → "문의가 접수되었습니다" 자동 발송
   - ✅ **전문적인 인상** → 자동화된 이메일로 신뢰도 향상

4. **사용 위치**:
   - `src/lib/utils/email.ts`: 이메일 발송 유틸리티
   - `src/app/api/contact/route.ts`: 문의 접수 시 이메일 발송
   - `src/app/admin/contacts/page.tsx`: 관리자 문의 관리 페이지

**결과**: 이메일을 설정하지 않으면 문의 기능이 작동하지만, 관리자가 문의를 놓치거나 사용자가 불안해할 수 있습니다.

### 선택: Resend 또는 SendGrid

#### 옵션 A: Resend 사용 (권장 - 간단함)
1. [Resend](https://resend.com) 접속 및 회원가입
2. 대시보드에서 **"API Keys"** 클릭
3. **"Create API Key"** 클릭
4. API 키 이름 입력 (예: "carrot-stop-production")
5. API 키 복사 (한 번만 표시됨!)

#### 옵션 B: SendGrid 사용
1. [SendGrid](https://sendgrid.com) 접속 및 회원가입
2. Settings → **"API Keys"** 클릭
3. **"Create API Key"** 클릭
4. API 키 이름 입력 및 권한 선택 (Full Access 권장)
5. API 키 복사 (한 번만 표시됨!)

### 단계별 가이드

#### 5.1 환경변수 설정

##### 로컬 개발 환경 (`.env.local`)
```env
# Resend 사용 시
RESEND_API_KEY=re_xxxxxxxxxxxxx

# 또는 SendGrid 사용 시
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx

# 공통 (필수)
EMAIL_FROM=noreply@yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com
```

**참고**:
- `EMAIL_FROM`: 발신자 이메일 주소 (도메인 인증 필요)
- `ADMIN_EMAIL`: 관리자 이메일 주소 (문의 알림을 받을 주소)

##### Vercel 배포 환경
1. Vercel 대시보드 접속
2. 프로젝트 선택
3. Settings → **"Environment Variables"** 클릭
4. 다음 변수 추가:
   - `RESEND_API_KEY` 또는 `SENDGRID_API_KEY`
   - `EMAIL_FROM`
   - `ADMIN_EMAIL`
5. 환경 선택: Production, Preview, Development 모두 선택
6. **"Save"** 클릭

#### 5.2 도메인 인증 (프로덕션)
이메일 서비스에서 발신자 도메인을 인증해야 합니다:

**Resend**:
1. 대시보드 → **"Domains"** 클릭
2. **"Add Domain"** 클릭
3. 도메인 입력 (예: `yourdomain.com`)
4. DNS 레코드 추가 (서비스에서 제공하는 값)
5. 인증 완료 대기

**SendGrid**:
1. Settings → **"Sender Authentication"** 클릭
2. **"Authenticate Your Domain"** 클릭
3. 도메인 입력 및 DNS 레코드 추가
4. 인증 완료 대기

#### 5.3 테스트
1. 개발 서버 재시작: `npm run dev`
2. Contact 페이지 접속: `http://localhost:3000/contact`
3. 테스트 문의 제출
4. 다음 확인:
   - ✅ 관리자 이메일 수신 확인
   - ✅ 사용자 확인 이메일 수신 확인
   - ✅ Firebase 콘솔에서 `contacts` 컬렉션에 데이터 저장 확인

#### 5.4 문제 해결
- **이메일 미수신**: 스팸함 확인, API 키 확인, 도메인 인증 확인
- **에러 발생**: 개발 서버 콘솔 로그 확인

---

## 6️⃣ 데이터 백업 전략 수립

### 목적
데이터 손실을 방지하기 위한 정기 백업 계획을 수립합니다.

### 왜 필요한가요?
데이터 손실은 복구 불가능한 문제를 일으킵니다:

1. **데이터 손실 시나리오**:
   - ❌ **실수로 데이터 삭제** → 마이그레이션 스크립트 오류, 잘못된 쿼리
   - ❌ **Firebase 프로젝트 삭제** → 실수로 프로젝트 삭제
   - ❌ **보안 침해** → 악의적인 데이터 삭제
   - ❌ **서비스 중단** → Firebase 장애 (드물지만 가능)

2. **백업 없을 때 문제**:
   - ❌ **모든 데이터 영구 손실** → 복구 불가능
   - ❌ **사용자 신뢰 상실** → "내 캠페인/포트폴리오가 사라졌어요"
   - ❌ **비즈니스 중단** → 서비스 재시작 불가능

3. **백업 전략의 이점**:
   - ✅ **빠른 복구** → 최대 24시간 전 데이터로 복구 가능
   - ✅ **안심** → 실수로 삭제해도 복구 가능
   - ✅ **규정 준수** → 데이터 보관 의무 준수 (필요 시)

4. **Firebase 자동 백업의 장점**:
   - ✅ **자동화** → 매일 자동 백업, 설정만 하면 됨
   - ✅ **비용 효율적** → Cloud Storage에 저장, 저렴함
   - ✅ **빠른 복원** → Firebase 콘솔에서 몇 번 클릭으로 복원

**결과**: 백업 전략이 없으면 한 번의 실수로 모든 데이터를 잃을 수 있습니다. 특히 프로덕션 환경에서는 필수입니다.

### 단계별 가이드

#### 6.1 백업 방법 선택

##### 방법 A: Firebase 자동 백업 (권장)
1. Firebase 콘솔 → Firestore Database
2. **"백업"** 탭 클릭
3. **"백업 예약"** 클릭
4. 백업 빈도 선택:
   - 매일 (권장)
   - 매주
   - 매월
5. 백업 보관 기간 선택 (예: 30일)
6. **"저장"** 클릭

##### 방법 B: 수동 백업 스크립트 (선택사항)
AI가 작성한 검증 스크립트를 참고하여 백업 스크립트를 작성할 수 있습니다.

#### 6.2 백업 복원 테스트
1. Firebase 콘솔 → Firestore Database
2. **"가져오기"** 클릭
3. 테스트 백업 파일 선택
4. 복원 테스트 수행
5. 복원 프로세스가 정상 작동하는지 확인

#### 6.3 백업 정책 문서화
다음 내용을 문서로 정리 (선택사항):
- 백업 빈도: 매일
- 백업 보관 기간: 30일
- 백업 위치: Cloud Storage
- 복원 절차: Firebase 콘솔에서 가져오기

---

## ✅ 작업 완료 체크리스트

### 중간 우선순위
- [ ] 1. 데이터베이스 스키마 확인 완료
- [ ] 2. API 응답 검증 완료
- [ ] 3. 데이터 마이그레이션 실행 완료

### 낮은 우선순위
- [ ] 4. Firestore 인덱스 생성 완료
- [ ] 5. 이메일 발송 서비스 설정 완료
- [ ] 6. 데이터 백업 전략 수립 완료

---

## 🆘 문제 발생 시

### 일반적인 문제
1. **환경변수 오류**: `.env.local` 파일 확인, Vercel 환경변수 확인
2. **Firebase 권한 오류**: 서비스 계정 키 확인
3. **API 응답 오류**: 개발 서버 콘솔 로그 확인

### 도움 요청
문제가 발생하면 다음 정보를 포함하여 AI에게 문의:
- 작업 번호 (예: "3번 작업")
- 에러 메시지 (전체)
- 실행한 명령어
- 예상 결과 vs 실제 결과

---

## 📝 참고 자료

- **WORK_SUMMARY.md**: 전체 작업 현황
- **scripts/migrate-db.ts**: 마이그레이션 스크립트
- **scripts/validate-data.ts**: 데이터 검증 스크립트
- **src/lib/utils/email.ts**: 이메일 발송 코드
- **Firebase 문서**: https://firebase.google.com/docs/firestore
- **Resend 문서**: https://resend.com/docs
- **SendGrid 문서**: https://docs.sendgrid.com

---

**작성 완료일**: 2025-01-27  
**다음 업데이트**: 작업 완료 후 진행 상황 반영

