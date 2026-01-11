# 불필요한 파일 정리 보고서

프로젝트에서 사용되지 않거나 중복되는 파일들을 정리했습니다.

## 📋 삭제 가능한 파일 목록

### 1. 리다이렉트만 하는 페이지 (삭제 후 라우팅 설정)

#### ✅ 즉시 삭제 가능
- **`src/app/campaigns/page.tsx`**
  - 내용: `/main`으로 리다이렉트만 함
  - 이유: 실제 기능 없음, 리다이렉트는 Next.js 라우팅으로 처리 가능
  
- **`src/app/influencer/campaigns/page.tsx`**
  - 내용: `/influencer/feed`로 리다이렉트만 함
  - 이유: 실제 기능 없음

#### 🔍 검토 필요 (빈 페이지 - 실제로 사용되지 않음)
- **`src/app/admin/campaigns/[id]/page.tsx`**
  - 내용: 빈 컴포넌트만 반환 (실제 구현 없음)
  - 이유: `/admin/campaigns`에서 상세 페이지로 이동하는 링크가 있지만, 실제 구현이 없음
  - 대안: `/campaigns/[id]`를 사용하거나 구현 필요
  
- **`src/app/advertiser/campaigns/[id]/page.tsx`**
  - 내용: 빈 컴포넌트만 반환 (실제 구현 없음)
  - 이유: 실제 구현이 없음
  - 대안: `/campaigns/[id]`를 사용하거나 구현 필요
  
- **`src/app/influencer/campaigns/[id]/page.tsx`**
  - 내용: 빈 컴포넌트만 반환 (실제 구현 없음)
  - 이유: 실제 구현이 없음
  - 대안: `/campaigns/[id]`를 사용하거나 구현 필요

### 2. 사용되지 않는 컴포넌트

#### ✅ 삭제 권장
- **`src/components/main/RadialHero.tsx`**
  - 이유: 어디서도 import되지 않음
  - 영향: 다른 파일과 독립적이므로 안전하게 삭제 가능
  
- **`src/components/main/MainTopNav.tsx`**
  - 이유: 어디서도 import되지 않음
  - 영향: `shared/TopNav.tsx`가 실제로 사용됨
  
- **`src/components/main/CampaignCard.tsx`**
  - 이유: `RadialHero.tsx`에서만 사용되는데, `RadialHero`가 사용되지 않음
  - 영향: `shared/CampaignCard.tsx`가 실제로 사용됨
  
- **`src/components/main/FloatingCharacters.tsx`**
  - 이유: `RadialHero.tsx`에서만 사용되는데, `RadialHero`가 사용되지 않음
  
- **`src/components/main/PlaceholderSection.tsx`**
  - 이유: 어디서도 import되지 않음
  
- **`src/components/main/Sidebar.tsx`**
  - 이유: 어디서도 import되지 않음
  
- **`src/components/TopNav.tsx`** (루트에 있는 것)
  - 이유: `shared/TopNav.tsx`와 중복, 실제로는 `shared/TopNav.tsx`가 사용됨
  - 참고: `components/TopNav.tsx`와 `components/shared/TopNav.tsx`가 별도로 존재
  
- **`src/components/campaigns/CampaignsList.tsx`**
  - 이유: `shared/CampaignsList.tsx`와 중복, 실제로는 `shared/CampaignsList.tsx`가 사용됨

### 3. 중복 기능 페이지 (검토 필요)

#### 🔍 검토 권장
- **`src/app/advertiser/feed/page.tsx`**
  - 이유: `/advertiser/dashboard`와 기능 중복 가능성
  - 현황: 어디서도 링크되지 않음
  - 확인 필요: 실제로 사용되는지, 아니면 삭제할지

## 📊 사용 중인 파일 (유지)

### 정상 사용 중인 페이지
- ✅ `src/app/page.tsx` - 랜딩 페이지 (홈)
- ✅ `src/app/main/page.tsx` - 메인 페이지 (캠페인 목록)
- ✅ `src/app/trial/start/page.tsx` - 무료 체험 시작 페이지
- ✅ `src/app/auth/login/page.tsx` - 로그인
- ✅ `src/app/auth/signup/page.tsx` - 회원가입
- ✅ `src/app/advertiser/dashboard/page.tsx` - 광고주 대시보드
- ✅ `src/app/influencer/feed/page.tsx` - 인플루언서 피드
- ✅ `src/app/admin/dashboard/page.tsx` - 관리자 대시보드
- ✅ `src/app/campaigns/[id]/page.tsx` - 캠페인 상세 (실제 구현됨)
- ✅ `src/app/campaigns/search/page.tsx` - 캠페인 검색
- ✅ `src/app/campaigns/category/[category]/page.tsx` - 카테고리별 캠페인

### 정상 사용 중인 컴포넌트
- ✅ `src/components/shared/TopNav.tsx` - 실제 사용됨
- ✅ `src/components/shared/CampaignCard.tsx` - 실제 사용됨
- ✅ `src/components/shared/CampaignList.tsx` - 실제 사용됨
- ✅ `src/components/survey/*` - `/trial/start`에서 사용

## 🗑️ 삭제 권장 파일 목록 (총 11개)

### 즉시 삭제 가능 (7개)
1. `src/app/campaigns/page.tsx`
2. `src/app/influencer/campaigns/page.tsx`
3. `src/components/main/RadialHero.tsx`
4. `src/components/main/MainTopNav.tsx`
5. `src/components/main/CampaignCard.tsx`
6. `src/components/main/FloatingCharacters.tsx`
7. `src/components/main/PlaceholderSection.tsx`

### 검토 후 삭제 (4개)
8. `src/components/main/Sidebar.tsx` - 사용되지 않음 확인
9. `src/components/TopNav.tsx` - `shared/TopNav.tsx`와 중복
10. `src/components/campaigns/CampaignsList.tsx` - `shared/CampaignsList.tsx`와 중복
11. `src/app/advertiser/feed/page.tsx` - 사용 여부 확인 후 결정

### 빈 페이지 (3개) - 구현 필요 또는 삭제
12. `src/app/admin/campaigns/[id]/page.tsx` - 빈 페이지
13. `src/app/advertiser/campaigns/[id]/page.tsx` - 빈 페이지  
14. `src/app/influencer/campaigns/[id]/page.tsx` - 빈 페이지

## 📝 권장 작업 순서

1. **1단계: 즉시 삭제 가능한 파일 (7개)**
   - 리다이렉트 페이지 2개
   - 사용되지 않는 `main/` 컴포넌트 5개

2. **2단계: 중복 파일 삭제 (2개)**
   - `components/TopNav.tsx` (shared 버전 사용)
   - `components/campaigns/CampaignsList.tsx` (shared 버전 사용)

3. **3단계: 검토 후 결정 (2개)**
   - `components/main/Sidebar.tsx` - 향후 사용 계획이 있으면 유지
   - `src/app/advertiser/feed/page.tsx` - 기능 확인 후 삭제 또는 리다이렉트

4. **4단계: 빈 페이지 처리 (3개)**
   - 구현 필요 또는 삭제 후 `/campaigns/[id]`로 통합

