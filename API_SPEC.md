# API 명세서

모든 API는 `/api` prefix를 사용합니다. 인증은 Firebase Auth 토큰을 Authorization 헤더에 포함해야 합니다.

## 인증

모든 요청에 다음 헤더 필요:
```
Authorization: Bearer <firebase-id-token>
```

## 응답 형식

성공 응답 (200-299):
```json
{
  "success": true,
  "data": { ... }
}
```

에러 응답 (400+):
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message"
  }
}
```

---

## 1. 인증 API

### POST /api/auth/signup
회원가입

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "displayName": "User Name",
  "role": "advertiser" | "influencer"
}
```

**Response:**
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

**권한:** 인증 불필요 (회원가입)

---

### POST /api/auth/login
로그인 (실제로는 클라이언트에서 Firebase Auth SDK 사용 권장)

**권한:** 인증 불필요

---

### GET /api/auth/me
현재 사용자 정보 조회

**Response:**
```json
{
  "success": true,
  "data": {
    "uid": "user-uid",
    "email": "user@example.com",
    "displayName": "User Name",
    "role": "advertiser",
    "profile": { ... }
  }
}
```

**권한:** 인증 필수

---

## 2. 캠페인 API

### POST /api/campaigns/generate
자연어 입력을 받아 LLM으로 캠페인 생성

**Request:**
```json
{
  "naturalLanguageInput": "우리 제품을 20-30대 여성들에게 알리고 싶어요. 친근하고 따뜻한 느낌으로..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "campaignId": "campaign-123",
    "proposalMarkdown": "# 캠페인 제안서\n...",
    "spec": {
      "objective": "...",
      "target_audience": { ... },
      "clarification_questions": [ ... ]
    },
    "status": "GENERATED"
  }
}
```

**권한:** `advertiser` 역할 필수

---

### GET /api/campaigns
캠페인 리스트 조회

**Query Parameters:**
- `status?`: 필터링할 상태
- `limit?`: 페이지 크기 (기본 20)
- `cursor?`: 페이지네이션 커서

**Response:**
```json
{
  "success": true,
  "data": {
    "campaigns": [
      {
        "id": "campaign-123",
        "title": "캠페인 제목",
        "status": "OPEN",
        "createdAt": "2024-01-01T00:00:00Z",
        ...
      }
    ],
    "nextCursor": "cursor-string" | null
  }
}
```

**권한:** 
- `advertiser`: 자신의 캠페인만
- `influencer`: OPEN 상태 캠페인만
- `admin`: 모든 캠페인

---

### GET /api/campaigns/open
오픈 캠페인 리스트 (인플루언서용)

**Query Parameters:**
- `limit?`: 페이지 크기
- `cursor?`: 페이지네이션 커서

**Response:**
```json
{
  "success": true,
  "data": {
    "campaigns": [ ... ]
  }
}
```

**권한:** `influencer` 역할 필수

---

### GET /api/campaigns/[id]
캠페인 상세 조회

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "campaign-123",
    "title": "...",
    "status": "OPEN",
    "spec": { ... },
    "proposalMarkdown": "...",
    "applications": [ ... ],  // 광고주만
    "submissions": [ ... ],   // 광고주만
    ...
  }
}
```

**권한:** 
- `advertiser`: 자신의 캠페인만
- `influencer`: OPEN 상태 캠페인만
- `admin`: 모든 캠페인

---

### POST /api/campaigns/[id]/clarify
확인 질문 답변 제출

**Request:**
```json
{
  "answers": [
    {
      "questionIndex": 0,
      "selectedOptions": ["option1", "option2"]
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "campaignId": "campaign-123",
    "status": "REVIEWED"
  }
}
```

**권한:** `advertiser` + 캠페인 소유자

---

### POST /api/campaigns/[id]/approve
캠페인 승인 및 오픈

**Request:**
```json
{
  "action": "approve" | "reject",
  "rejectReason?: string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "campaignId": "campaign-123",
    "status": "OPEN"
  }
}
```

**권한:** `advertiser` + 캠페인 소유자

---

### POST /api/campaigns/[id]/open
캠페인을 모집 상태로 전환

**Response:**
```json
{
  "success": true,
  "data": {
    "campaignId": "campaign-123",
    "status": "OPEN"
  }
}
```

**권한:** `advertiser` + 캠페인 소유자 또는 `admin`

---

## 3. 지원 (Application) API

### POST /api/campaigns/[id]/applications
캠페인 지원

**Request:**
```json
{
  "message": "지원 메시지 (옵션)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "applicationId": "app-123",
    "campaignId": "campaign-123",
    "status": "APPLIED"
  }
}
```

**권한:** `influencer` 역할 필수

---

### GET /api/campaigns/[id]/applications
캠페인 지원 목록 조회

**Response:**
```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "id": "app-123",
        "influencerId": "user-456",
        "influencer": {
          "displayName": "...",
          "profile": { ... }
        },
        "status": "APPLIED",
        "createdAt": "..."
      }
    ]
  }
}
```

**권한:** `advertiser` + 캠페인 소유자 또는 `admin`

---

### POST /api/campaigns/[id]/applications/[appId]/select
인플루언서 선정

**Request:**
```json
{
  "action": "select" | "reject",
  "rejectReason?: string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "applicationId": "app-123",
    "status": "SELECTED"
  }
}
```

**권한:** `advertiser` + 캠페인 소유자 또는 `admin`

---

## 4. 제출 (Submission) API

### POST /api/campaigns/[id]/submissions
증빙 제출

**Request:**
```json
{
  "postUrl": "https://instagram.com/p/...",
  "screenshotUrls": ["path/to/screenshot1.jpg", ...],
  "metrics": {
    "views": 10000,
    "likes": 500,
    "comments": 50
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "submissionId": "sub-123",
    "status": "SUBMITTED"
  }
}
```

**권한:** `influencer` + 선정된 인플루언서만

---

### GET /api/campaigns/[id]/submissions
캠페인 제출 목록 조회

**Response:**
```json
{
  "success": true,
  "data": {
    "submissions": [ ... ]
  }
}
```

**권한:** `advertiser` + 캠페인 소유자 또는 `admin`

---

### POST /api/campaigns/[id]/submissions/[subId]/review
제출 검토 (승인/수정요청)

**Request:**
```json
{
  "action": "approve" | "needs_fix",
  "feedback?: string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "submissionId": "sub-123",
    "status": "APPROVED"
  }
}
```

**권한:** `advertiser` + 캠페인 소유자 또는 `admin`

---

## 5. 파일 업로드 API

### POST /api/storage/upload
업로드용 Signed URL 생성

**Request:**
```json
{
  "fileName": "screenshot.jpg",
  "contentType": "image/jpeg",
  "campaignId": "campaign-123",
  "type": "submission_screenshot"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://storage.googleapis.com/...",
    "filePath": "campaigns/campaign-123/submissions/file.jpg",
    "publicUrl": "https://storage.googleapis.com/..."
  }
}
```

**권한:** 인증 필수

---

## 6. 운영자 (Admin) API

### GET /api/admin/campaigns
전체 캠페인 모니터링

**Query Parameters:**
- `status?`: 상태 필터
- `overdue?: boolean`: 지연된 캠페인만

**Response:**
```json
{
  "success": true,
  "data": {
    "campaigns": [ ... ],
    "statistics": {
      "total": 100,
      "byStatus": { ... },
      "overdueCount": 5
    }
  }
}
```

**권한:** `admin` 역할 필수

---

### PATCH /api/admin/campaigns/[id]/status
캠페인 상태 강제 변경

**Request:**
```json
{
  "status": "COMPLETED",
  "reason": "운영자 조치"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "campaignId": "campaign-123",
    "status": "COMPLETED"
  }
}
```

**권한:** `admin` 역할 필수

---

### POST /api/admin/reports/generate
리포트 수동 생성

**Request:**
```json
{
  "campaignId": "campaign-123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reportId": "report-123",
    "campaignId": "campaign-123"
  }
}
```

**권한:** `admin` 역할 필수

---

## 에러 코드

- `UNAUTHORIZED`: 인증 토큰 없음 또는 유효하지 않음
- `FORBIDDEN`: 권한 없음
- `NOT_FOUND`: 리소스를 찾을 수 없음
- `VALIDATION_ERROR`: 입력 검증 실패
- `LLM_ERROR`: LLM API 호출 실패
- `INTERNAL_ERROR`: 서버 내부 오류

