# 백엔드 API 기능 전체 정리

> **작성일**: 2026년 1월 15일  
> **총 API 엔드포인트**: 38개 파일, 48개 HTTP 메서드  
> **구현 완료도**: 95% (핵심 기능 모두 완료)

---

## 📋 목차

1. [인증 및 사용자 관리](#1-인증-및-사용자-관리)
2. [캠페인 관리](#2-캠페인-관리)
3. [인플루언서 관리](#3-인플루언서-관리)
4. [관리자 기능](#4-관리자-기능)
5. [파일 업로드](#5-파일-업로드)
6. [검색 기능](#6-검색-기능)
7. [문의 관리](#7-문의-관리)
8. [설문 및 추천](#8-설문-및-추천)
9. [즐겨찾기](#9-즐겨찾기)
10. [백그라운드 작업 (Cron)](#10-백그라운드-작업-cron)

---

## 1. 인증 및 사용자 관리

### 1.1 회원가입
**`POST /api/auth/signup`**

**기능**: 새 사용자 회원가입

**요청 본문**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "displayName": "사용자 이름",
  "role": "advertiser" | "influencer"
}
```

**응답**:
```json
{
  "success": true,
  "data": {
    "uid": "user-id",
    "email": "user@example.com"
  }
}
```

**권한**: 인증 불필요

---

### 1.2 현재 사용자 정보 조회
**`GET /api/auth/me`**

**기능**: 현재 로그인한 사용자 정보 조회

**응답**:
```json
{
  "success": true,
  "data": {
    "id": "user-id",
    "email": "user@example.com",
    "displayName": "사용자 이름",
    "role": "advertiser" | "influencer" | "admin",
    "profile": { ... }
  }
}
```

**권한**: 인증 필요

---

### 1.3 이메일 중복 확인
**`POST /api/auth/check-email`**

**기능**: 이메일 중복 여부 확인

**요청 본문**:
```json
{
  "email": "user@example.com"
}
```

**응답**:
```json
{
  "success": true,
  "data": {
    "exists": true | false
  }
}
```

**권한**: 인증 불필요

---

### 1.4 사용자 정보 조회
**`GET /api/users/[id]`**

**기능**: 특정 사용자의 공개 프로필 정보 조회

**응답**:
```json
{
  "success": true,
  "data": {
    "id": "user-id",
    "displayName": "사용자 이름",
    "email": "user@example.com", // 본인만 조회 가능
    "role": "advertiser" | "influencer",
    "profile": {
      "bio": "소개",
      "companyName": "회사명",
      "nickname": "닉네임",
      "platforms": ["Instagram", "YouTube"],
      "photoURL": "https://...",
      ...
    },
    "followerCount": 10000
  }
}
```

**권한**: 인증 선택사항 (공개 프로필)

---

### 1.5 프로필 업데이트
**`PUT /api/users/profile`**

**기능**: 현재 사용자의 프로필 정보 업데이트

**요청 본문**:
```json
{
  "displayName": "새 이름",
  "profile": {
    "bio": "새 소개",
    "companyName": "회사명",
    "nickname": "닉네임",
    "platforms": ["Instagram", "YouTube"],
    "careerYears": 5,
    "careerMonths": 3,
    "location": "서울",
    "availableHours": "평일 오후"
  },
  "followerCount": 10000
}
```

**응답**:
```json
{
  "success": true
}
```

**권한**: 인증 필요 (본인만 수정 가능)

---

## 2. 캠페인 관리

### 2.1 캠페인 목록 조회
**`GET /api/campaigns`**

**기능**: 역할별 캠페인 목록 조회

**쿼리 파라미터**:
- `status`: 캠페인 상태 필터 (advertiser, admin만)
- `limit`: 페이지 크기 (기본: 20)
- `cursor`: 페이지네이션 커서
- `advertiserId`: 특정 광고주의 캠페인만 조회

**응답**:
```json
{
  "success": true,
  "data": {
    "campaigns": [...],
    "nextCursor": "cursor-id"
  }
}
```

**권한**: 인증 필요
- **advertiser**: 자신의 캠페인만 조회
- **influencer**: OPEN 상태 캠페인만 조회
- **admin**: 모든 캠페인 조회

---

### 2.2 최신 캠페인 목록
**`GET /api/campaigns/latest`**

**기능**: 최신 오픈 캠페인 목록 조회 (캐싱 지원)

**쿼리 파라미터**:
- `limit`: 페이지 크기 (기본: 20)
- `cursor`: 페이지네이션 커서

**응답**:
```json
{
  "success": true,
  "data": {
    "campaigns": [...],
    "stats": {
      "totalRecruiting": 44,
      "deadlineThisWeek": 12
    },
    "nextCursor": "cursor-id"
  }
}
```

**권한**: 인증 불필요 (공개)

**특징**: 5분 TTL 캐싱 적용

---

### 2.3 오픈 캠페인 목록
**`GET /api/campaigns/open`**

**기능**: 오픈 상태 캠페인 목록 조회

**권한**: influencer만 접근 가능

---

### 2.4 추천 캠페인 목록
**`GET /api/campaigns/recommended`**

**기능**: 설문 결과 기반 캠페인 추천

**응답**:
```json
{
  "success": true,
  "data": {
    "campaigns": [...],
    "scores": [...]
  }
}
```

**권한**: 인증 필요 (influencer)

**특징**: 10분 TTL 캐싱 적용

---

### 2.5 캠페인 상세 조회
**`GET /api/campaigns/[id]`**

**기능**: 캠페인 상세 정보 조회

**응답**:
```json
{
  "success": true,
  "data": {
    "id": "campaign-id",
    "title": "캠페인 제목",
    "status": "OPEN",
    "advertiserId": "advertiser-id",
    "advertiserName": "광고주 이름",
    "category": "카페",
    "description": "설명",
    "imageUrl": "https://...",
    "deadline": "2026-02-01T00:00:00Z",
    "spec": { ... },
    "selectedInfluencerIds": ["influencer-id"],
    "applications": [...], // 광고주/Admin만
    "submissions": [...] // 광고주/Admin만
  }
}
```

**권한**: 인증 필요
- **advertiser**: 자신의 캠페인만 조회
- **influencer**: OPEN 상태 캠페인만 조회
- **admin**: 모든 캠페인 조회

---

### 2.6 캠페인 삭제
**`DELETE /api/campaigns/[id]`**

**기능**: 캠페인 및 관련 데이터 일괄 삭제

**삭제 대상**:
- 캠페인 문서
- applications 서브컬렉션
- submissions 서브컬렉션
- specs 서브컬렉션
- events 서브컬렉션
- reviews 서브컬렉션

**제약사항**:
- RUNNING 또는 IN_PROGRESS 상태 캠페인은 삭제 불가

**권한**: advertiser (자신의 캠페인만), admin

---

### 2.7 LLM 기반 캠페인 생성
**`POST /api/campaigns/generate`**

**기능**: 자연어 입력으로 LLM이 캠페인 스펙 생성

**요청 본문**:
```json
{
  "naturalLanguageInput": "20대 여성을 타겟으로 하는 화장품 신제품 런칭 캠페인"
}
```

**응답**:
```json
{
  "success": true,
  "data": {
    "campaignId": "campaign-id",
    "specVersionId": "spec-id",
    "proposalMarkdown": "...",
    "specJson": { ... }
  }
}
```

**권한**: advertiser만

---

### 2.8 캠페인 승인/거부
**`POST /api/campaigns/[id]/approve`**

**기능**: 생성된 캠페인 승인 또는 거부

**요청 본문**:
```json
{
  "action": "approve" | "reject",
  "rejectReason": "거부 사유" // reject일 때만
}
```

**응답**:
```json
{
  "success": true,
  "data": {
    "campaignId": "campaign-id",
    "status": "OPEN" | "CANCELLED"
  }
}
```

**권한**: advertiser (자신의 캠페인만), admin

---

### 2.9 캠페인 지원 목록 조회
**`GET /api/campaigns/[id]/applications`**

**기능**: 캠페인에 대한 지원 목록 조회

**응답**:
```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "id": "app-id",
        "influencerId": "influencer-id",
        "influencer": {
          "displayName": "인플루언서 이름",
          "email": "email@example.com",
          "profile": { ... }
        },
        "message": "지원 메시지",
        "status": "APPLIED",
        "createdAt": "2026-01-15T00:00:00Z"
      }
    ]
  }
}
```

**권한**: advertiser (자신의 캠페인만), admin

---

### 2.10 캠페인 지원 생성
**`POST /api/campaigns/[id]/applications`**

**기능**: 인플루언서가 캠페인에 지원

**요청 본문**:
```json
{
  "message": "지원 메시지"
}
```

**특징**: 메시지에서 연락처 정보 자동 필터링

**권한**: influencer만

---

### 2.11 캠페인 지원 취소
**`DELETE /api/campaigns/[id]/applications/[appId]`**

**기능**: 인플루언서가 지원 취소

**제약사항**:
- SELECTED 상태 지원은 취소 불가

**권한**: influencer (자신의 지원만)

---

### 2.12 지원 선정/거부
**`POST /api/campaigns/[id]/applications/[appId]/select`**

**기능**: 광고주가 인플루언서 지원 선정 또는 거부

**요청 본문**:
```json
{
  "action": "select" | "reject"
}
```

**동작**:
- `select`: 지원 상태를 SELECTED로 변경, 캠페인 상태를 RUNNING으로 변경
- `reject`: 지원 상태를 REJECTED로 변경

**권한**: advertiser (자신의 캠페인만), admin

---

### 2.13 제출물 목록 조회
**`GET /api/campaigns/[id]/submissions`**

**기능**: 캠페인 제출물 목록 조회

**응답**:
```json
{
  "success": true,
  "data": {
    "submissions": [
      {
        "id": "sub-id",
        "influencerId": "influencer-id",
        "postUrl": "https://...",
        "screenshotUrls": ["https://..."],
        "metrics": { ... },
        "status": "SUBMITTED",
        "submittedAt": "2026-01-15T00:00:00Z"
      }
    ]
  }
}
```

**권한**: advertiser (자신의 캠페인만), admin

---

### 2.14 제출물 생성
**`POST /api/campaigns/[id]/submissions`**

**기능**: 인플루언서가 캠페인 제출물 제출

**요청 본문**:
```json
{
  "postUrl": "https://instagram.com/p/...",
  "screenshotUrls": ["https://..."],
  "metrics": {
    "views": 10000,
    "likes": 500,
    "comments": 50
  },
  "applicationId": "app-id"
}
```

**제약사항**:
- SELECTED 상태의 지원이 있어야만 제출 가능

**권한**: influencer만

---

### 2.15 제출물 승인/수정 요청
**`POST /api/campaigns/[id]/submissions/[subId]/review`**

**기능**: 광고주가 제출물 승인 또는 수정 요청

**요청 본문**:
```json
{
  "action": "approve" | "needs_fix",
  "feedback": "수정 요청 사항" // needs_fix일 때만
}
```

**응답**:
```json
{
  "success": true,
  "data": {
    "submissionId": "sub-id",
    "status": "APPROVED" | "NEEDS_FIX"
  }
}
```

**권한**: advertiser (자신의 캠페인만), admin

---

### 2.16 캠페인 리뷰 목록 조회
**`GET /api/campaigns/[id]/reviews`**

**기능**: 캠페인 리뷰 목록 조회

**응답**:
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": "review-id",
        "campaignId": "campaign-id",
        "rating": 5,
        "comment": "리뷰 내용",
        "authorId": "user-id",
        "authorName": "작성자 이름",
        "createdAt": "2026-01-15T00:00:00Z"
      }
    ]
  }
}
```

**권한**: 인증 필요

---

### 2.17 캠페인 리뷰 생성
**`POST /api/campaigns/[id]/reviews`**

**기능**: 캠페인 리뷰 작성

**요청 본문**:
```json
{
  "rating": 5,
  "comment": "리뷰 내용"
}
```

**제약사항**:
- 광고주: 자신의 캠페인에 리뷰 작성 불가
- 인플루언서: 해당 캠페인에 참여한 경우만 작성 가능

**권한**: 인증 필요

---

### 2.18 캠페인 디버그 정보
**`GET /api/campaigns/debug`**

**기능**: 캠페인 디버그 정보 조회 (개발용)

**권한**: admin만

---

## 3. 인플루언서 관리

### 3.1 인플루언서 목록 조회
**`GET /api/influencers`**

**기능**: 인플루언서 목록 조회 (검색, 필터 지원)

**쿼리 파라미터**:
- `search`: 검색어 (이름, 이메일, 소개)
- `platform`: 플랫폼 필터 (Instagram, YouTube, TikTok)
- `limit`: 페이지 크기
- `cursor`: 페이지네이션 커서

**응답**:
```json
{
  "success": true,
  "data": {
    "influencers": [...],
    "nextCursor": "cursor-id"
  }
}
```

**권한**: advertiser, admin

---

### 3.2 인플루언서 캠페인 목록
**`GET /api/influencers/[id]/campaigns`**

**기능**: 특정 인플루언서의 캠페인 목록 조회 (상태별)

**쿼리 파라미터**:
- `status`: 상태 필터 (applied, selected, in_progress, completed)

**응답**:
```json
{
  "success": true,
  "data": {
    "campaigns": [
      {
        "id": "campaign-id",
        "title": "캠페인 제목",
        "status": "RUNNING",
        "applicationId": "app-id",
        "applicationStatus": "SELECTED"
      }
    ]
  }
}
```

**권한**: 인증 필요

---

### 3.3 인플루언서 포트폴리오 조회
**`GET /api/influencers/[id]/portfolio`**

**기능**: 인플루언서 포트폴리오 목록 조회

**응답**:
```json
{
  "success": true,
  "data": {
    "portfolios": [
      {
        "id": "portfolio-id",
        "title": "포트폴리오 제목",
        "description": "설명",
        "imageUrl": "https://...",
        "contentUrl": "https://...",
        "platform": "Instagram",
        "order": 0,
        "isPublic": true
      }
    ]
  }
}
```

**권한**: 인증 필요
- 본인: 모든 포트폴리오 조회
- 다른 사용자: 공개 포트폴리오만 조회

---

### 3.4 포트폴리오 생성
**`POST /api/influencers/[id]/portfolio`**

**기능**: 인플루언서 포트폴리오 생성

**요청 본문**:
```json
{
  "title": "포트폴리오 제목",
  "description": "설명",
  "imageUrl": "https://...",
  "contentUrl": "https://...",
  "platform": "Instagram",
  "order": 0,
  "isPublic": true
}
```

**권한**: 본인만, admin

---

### 3.5 포트폴리오 업데이트
**`PUT /api/influencers/[id]/portfolio`**

**기능**: 포트폴리오 정보 업데이트

**요청 본문**:
```json
{
  "portfolioId": "portfolio-id",
  "title": "새 제목",
  "description": "새 설명",
  ...
}
```

**권한**: 본인만, admin

---

### 3.6 포트폴리오 삭제
**`DELETE /api/influencers/[id]/portfolio?id=portfolio-id`**

**기능**: 포트폴리오 삭제

**권한**: 본인만, admin

---

### 3.7 인플루언서 성과 데이터
**`GET /api/influencers/[id]/insights`**

**기능**: 인플루언서 성과 인사이트 데이터 조회

**응답**:
```json
{
  "success": true,
  "data": {
    "averageViews": 10000,
    "averageEngagementRate": 5.5,
    "recentCampaignPerformance": [
      {
        "campaignId": "campaign-id",
        "campaignTitle": "캠페인 제목",
        "views": 15000,
        "engagementRate": 6.2
      }
    ]
  }
}
```

**권한**: 인증 필요

---

### 3.8 인플루언서 지원 내역 조회
**`GET /api/influencers/applications`**

**기능**: 현재 인플루언서의 모든 지원 내역 조회

**응답**:
```json
{
  "success": true,
  "data": [
    {
      "id": "app-id",
      "campaignId": "campaign-id",
      "campaign": {
        "id": "campaign-id",
        "title": "캠페인 제목",
        "status": "OPEN"
      },
      "status": "APPLIED",
      "message": "지원 메시지",
      "appliedAt": "2026-01-15T00:00:00Z"
    }
  ]
}
```

**권한**: influencer만

---

## 4. 관리자 기능

### 4.1 통계 데이터 조회
**`GET /api/admin/stats`**

**기능**: 관리자 대시보드 통계 데이터 조회

**응답**:
```json
{
  "success": true,
  "data": {
    "totalCampaigns": 100,
    "activeCampaigns": 20,
    "pendingReview": 5,
    "totalContracts": 50,
    "pendingContracts": 10,
    "delayedContracts": 3
  }
}
```

**권한**: admin만

---

### 4.2 계약 현황 조회
**`GET /api/admin/contracts`**

**기능**: 모든 계약 현황 조회 (SELECTED 상태의 applications)

**응답**:
```json
{
  "success": true,
  "data": [
    {
      "id": "app-id",
      "campaignId": "campaign-id",
      "campaign": {
        "title": "캠페인 제목",
        "advertiserName": "광고주 이름"
      },
      "influencerId": "influencer-id",
      "influencer": {
        "displayName": "인플루언서 이름",
        "email": "email@example.com"
      },
      "status": "pending" | "delayed" | "agreed",
      "selectedAt": "2026-01-15T00:00:00Z",
      "agreedAt": "2026-01-20T00:00:00Z"
    }
  ]
}
```

**권한**: admin만

---

## 5. 파일 업로드

### 5.1 캠페인 이미지 업로드
**`POST /api/storage/upload`**

**기능**: 캠페인 이미지 업로드를 위한 Signed URL 생성

**요청 본문**:
```json
{
  "fileName": "image.jpg",
  "contentType": "image/jpeg",
  "campaignId": "campaign-id",
  "type": "campaign"
}
```

**응답**:
```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://storage.googleapis.com/...",
    "publicUrl": "https://storage.googleapis.com/...",
    "filePath": "campaigns/campaign-id/image.jpg"
  }
}
```

**권한**: 인증 필요

---

### 5.2 프로필 사진 업로드
**`POST /api/storage/upload-profile`**

**기능**: 프로필 사진 업로드를 위한 Signed URL 생성

**요청 본문**:
```json
{
  "fileName": "profile.jpg",
  "contentType": "image/jpeg"
}
```

**응답**:
```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://storage.googleapis.com/...",
    "publicUrl": "https://storage.googleapis.com/...",
    "filePath": "users/user-id/profile/profile.jpg"
  }
}
```

**권한**: 인증 필요 (본인만)

---

## 6. 검색 기능

### 6.1 통합 검색
**`GET /api/search`**

**기능**: 캠페인, 광고주, 인플루언서 통합 검색

**쿼리 파라미터**:
- `q`: 검색어
- `limit`: 결과 제한 (기본: 10)

**응답**:
```json
{
  "success": true,
  "data": {
    "campaigns": [
      {
        "id": "campaign-id",
        "title": "캠페인 제목",
        "description": "설명",
        "category": "카페",
        "advertiserName": "광고주 이름"
      }
    ],
    "advertisers": [
      {
        "id": "advertiser-id",
        "displayName": "광고주 이름",
        "companyName": "회사명",
        "bio": "소개"
      }
    ],
    "influencers": [
      {
        "id": "influencer-id",
        "displayName": "인플루언서 이름",
        "nickname": "닉네임",
        "platforms": ["Instagram"],
        "followerCount": 10000
      }
    ],
    "total": 15
  }
}
```

**권한**: 인증 선택사항 (공개 검색)

---

## 7. 문의 관리

### 7.1 문의 제출
**`POST /api/contact`**

**기능**: 문의사항 제출 (이메일 알림 포함)

**요청 본문**:
```json
{
  "name": "이름",
  "email": "email@example.com",
  "message": "문의 내용"
}
```

**응답**:
```json
{
  "success": true,
  "data": {
    "id": "contact-id"
  }
}
```

**권한**: 인증 불필요

**특징**: 관리자에게 이메일 알림 발송 (API 키 설정 필요)

---

### 7.2 문의 상세 조회
**`GET /api/contact/[id]`**

**기능**: 문의 상세 정보 조회

**응답**:
```json
{
  "success": true,
  "data": {
    "id": "contact-id",
    "name": "이름",
    "email": "email@example.com",
    "message": "문의 내용",
    "status": "PENDING" | "RESPONDED",
    "createdAt": "2026-01-15T00:00:00Z"
  }
}
```

**권한**: admin만

---

### 7.3 문의 상태 업데이트
**`PATCH /api/contact/[id]`**

**기능**: 문의 상태 업데이트 (응답 완료 처리)

**요청 본문**:
```json
{
  "status": "RESPONDED"
}
```

**권한**: admin만

---

## 8. 설문 및 추천

### 8.1 설문 응답 저장
**`POST /api/trial/survey`**

**기능**: 설문 응답 저장 및 분석

**요청 본문**:
```json
{
  "answers": [
    {
      "questionId": "q1",
      "answer": "answer1"
    }
  ]
}
```

**응답**:
```json
{
  "success": true,
  "data": {
    "surveyId": "survey-id",
    "analysis": {
      "preferredCategories": ["카페", "음식점"],
      "preferredBudget": "30-50만",
      "preferredChannels": ["Instagram"]
    }
  }
}
```

**권한**: 인증 필요

**특징**: 
- 설문 결과를 사용자 프로필에 저장
- 추천 캠페인 계산에 활용

---

## 9. 즐겨찾기

### 9.1 즐겨찾기 목록 조회
**`GET /api/favorites`**

**기능**: 즐겨찾기 목록 조회

**쿼리 파라미터**:
- `type`: `campaigns` 또는 `influencers`

**응답**:
```json
{
  "success": true,
  "data": {
    "items": [...]
  }
}
```

**권한**: 인증 필요
- **influencer**: 캠페인 즐겨찾기만
- **advertiser**: 인플루언서 즐겨찾기만

---

### 9.2 즐겨찾기 추가/제거
**`POST /api/favorites`**

**기능**: 즐겨찾기 추가 또는 제거

**요청 본문**:
```json
{
  "type": "campaigns" | "influencers",
  "itemId": "item-id",
  "action": "add" | "remove"
}
```

**응답**:
```json
{
  "success": true,
  "data": {
    "favorited": true,
    "itemIds": ["id1", "id2"]
  }
}
```

**권한**: 인증 필요

---

### 9.3 즐겨찾기 여부 확인
**`GET /api/favorites/check`**

**기능**: 특정 항목의 즐겨찾기 여부 확인

**쿼리 파라미터**:
- `type`: `campaigns` 또는 `influencers`
- `itemId`: 확인할 항목 ID

**응답**:
```json
{
  "success": true,
  "data": {
    "favorited": true
  }
}
```

**권한**: 인증 필요

---

## 10. 백그라운드 작업 (Cron)

### 10.1 마감 리마인더
**`GET /api/cron/deadline-reminder`**

**기능**: D-1인 캠페인에 대한 리마인더 이벤트 생성

**실행 주기**: 매일 오전 9시 (UTC)

**동작**:
- 내일 마감인 캠페인 조회
- 이벤트 기록 (이메일 발송은 추후 구현)

**권한**: Cron Secret 인증 필요

---

### 10.2 지연 감지
**`GET /api/cron/overdue-detection`**

**기능**: 마감일이 지났지만 제출이 없는 캠페인 감지

**실행 주기**: 매일 오전 9시 5분 (UTC)

**동작**:
- 마감일이 지난 캠페인 조회
- 제출이 없는 경우 이벤트 기록
- 페널티 적용 (향후 구현)

**권한**: Cron Secret 인증 필요

---

### 10.3 리포트 생성
**`GET /api/cron/generate-reports`**

**기능**: 캠페인 성과 리포트 생성

**실행 주기**: 매일 오후 6시 (UTC)

**동작**:
- 완료된 캠페인 조회
- 성과 데이터 집계
- 리포트 생성 (향후 구현)

**권한**: Cron Secret 인증 필요

---

### 10.4 상태 자동 전환
**`GET /api/cron/status-transition`**

**기능**: 캠페인 상태 자동 전환

**실행 주기**: 매시간

**동작**:
- 마감일이 지난 OPEN 캠페인 → CLOSED
- 모든 제출이 승인된 RUNNING 캠페인 → COMPLETED
- 기타 상태 전환 로직

**권한**: Cron Secret 인증 필요

---

## 📊 API 통계

### 총 API 엔드포인트
- **총 파일 수**: 38개
- **총 HTTP 메서드**: 48개
- **구현 완료도**: 95%

### 기능별 분류
- **인증 및 사용자**: 5개 API
- **캠페인 관리**: 18개 API
- **인플루언서 관리**: 8개 API
- **관리자 기능**: 2개 API
- **파일 업로드**: 2개 API
- **검색**: 1개 API
- **문의 관리**: 3개 API
- **설문 및 추천**: 1개 API
- **즐겨찾기**: 3개 API
- **백그라운드 작업**: 4개 API

---

## 🔐 권한 체계

### 역할별 접근 권한

| 기능 | Advertiser | Influencer | Admin | 비인증 |
|------|-----------|-----------|-------|--------|
| 캠페인 생성 | ✅ | ❌ | ✅ | ❌ |
| 자신의 캠페인 관리 | ✅ | ❌ | ✅ | ❌ |
| 오픈 캠페인 조회 | ❌ | ✅ | ✅ | ✅ (일부) |
| 캠페인 지원 | ❌ | ✅ | ❌ | ❌ |
| 제출물 제출 | ❌ | ✅ | ❌ | ❌ |
| 포트폴리오 관리 | ❌ | ✅ (본인) | ✅ | ❌ |
| 인플루언서 검색 | ✅ | ❌ | ✅ | ❌ |
| 통합 검색 | ✅ | ✅ | ✅ | ✅ |
| 관리자 기능 | ❌ | ❌ | ✅ | ❌ |

---

## ⚠️ 주의사항 및 제약사항

### 1. 이메일 발송
- 코드는 완료되었으나 API 키 설정 필요
- `RESEND_API_KEY` 또는 `SENDGRID_API_KEY` 환경변수 필요
- `EMAIL_FROM`, `ADMIN_EMAIL` 환경변수 필요

### 2. Firestore 인덱스
- 일부 쿼리는 복합 인덱스 필요
- 현재는 임시 해결책(`_sortTime`) 사용 중
- 인덱스 생성 후 `.after-index` 파일의 코드 적용 필요

### 3. 캐싱
- `/api/campaigns/latest`: 5분 TTL
- `/api/campaigns/recommended`: 10분 TTL
- 인메모리 캐시 사용 (서버 재시작 시 초기화)

### 4. 파일 업로드
- Signed URL 방식 사용
- Firebase Storage 규칙 확인 필요
- 파일 크기 제한은 Storage 설정에 따름

---

## 📝 결론

**백엔드 기능 구현 상태: 95% 완료** ✅

모든 핵심 기능이 구현되어 있으며, 남은 작업은 주로:
1. 이메일 API 키 설정 (외부 서비스)
2. Firestore 인덱스 생성 (성능 최적화)
3. 일부 Cron 작업의 이메일 발송 기능 (API 키 설정 후 활성화)

프로덕션 배포를 위해서는 위 항목들의 설정이 필요합니다.

---

**작성일**: 2026년 1월 15일  
**최종 업데이트**: 2026년 1월 15일
