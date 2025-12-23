# Firestore 데이터베이스 스키마

## 컬렉션 구조

### 1. users/{uid}
사용자 프로필 및 역할 정보

```typescript
{
  email: string;
  displayName?: string;
  role: "advertiser" | "influencer" | "admin";
  profile?: {
    companyName?: string;        // 광고주용
    bio?: string;                // 인플루언서용
    platforms?: string[];        // 인플루언서용 (instagram, youtube, tiktok 등)
    followerCount?: number;      // 인플루언서용
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 2. campaigns/{campaignId}
캠페인 메타데이터 및 상태

```typescript
{
  advertiserId: string;         // users/{uid} 참조
  status: 
    | "DRAFT"           // 초기 생성
    | "GENERATED"       // LLM 생성 완료
    | "REVIEWED"        // 광고주 검토 중
    | "CLARIFYING"      // 확인 질문 답변 대기
    | "APPROVED"        // 승인됨
    | "OPEN"            // 모집 중
    | "MATCHING"        // 인플루언서 선정 중
    | "RUNNING"         // 집행 중
    | "COMPLETED"       // 완료
    | "FAILED"          // 실패
    | "CANCELLED";      // 취소
  
  title: string;                 // LLM이 생성한 제목
  naturalLanguageInput?: string; // 원본 자연어 입력 (옵션, 이력 관리용)
  
  // 타임스탬프
  createdAt: Timestamp;
  updatedAt: Timestamp;
  approvedAt?: Timestamp;
  openedAt?: Timestamp;
  completedAt?: Timestamp;
  
  // 일정 정보 (spec에서 추출하여 상위 레벨에 저장)
  deadlineDate?: Timestamp;      // 마감일
  estimatedDuration?: number;    // 예상 기간 (일)
  
  // 현재 버전 참조
  currentSpecVersionId?: string; // campaigns/{id}/specs/{versionId}
  
  // 선택된 인플루언서
  selectedInfluencerIds?: string[]; // users/{uid}
}
```

### 3. campaigns/{campaignId}/specs/{specVersionId}
캠페인 스펙 버전 관리 (버전화 지원)

```typescript
{
  version: number;               // 1, 2, 3...
  proposalMarkdown: string;      // 사람이 읽는 마크다운 문서
  specJson: CampaignSpec;        // 구조화된 JSON (아래 타입 참조)
  createdAt: Timestamp;
  createdBy: string;             // users/{uid}
}
```

**CampaignSpec JSON 구조**:
```typescript
{
  objective: string;             // 캠페인 목적
  target_audience: {
    demographics?: string;
    interests?: string[];
    behaviors?: string[];
  };
  tone_and_mood: string[];
  recommended_content_types: Array<{
    platform: string;            // instagram, youtube, tiktok, blog 등
    format: string;              // post, story, reel, video 등
    rationale?: string;
  }>;
  schedule: {
    estimated_duration_days: number;
    milestones?: Array<{
      phase: string;
      days_from_start: number;
    }>;
  };
  budget_range: {
    min: number;
    max: number;
    currency: string;            // KRW, USD 등
    rationale: string;
  };
  kpis: {
    guaranteed: Array<{          // 보장 수치
      metric: string;            // views, likes, engagement_rate 등
      value: number;
    }>;
    target: Array<{              // 목표 수치
      metric: string;
      value: number;
    }>;
    reference: Array<{           // 참고 수치
      metric: string;
      value: number;
      source?: string;
    }>;
  };
  constraints: {
    must_have: string[];
    must_not: string[];
  };
  risk_flags: Array<{
    level: "low" | "medium" | "high";
    description: string;
    mitigation?: string;
  }>;
  clarification_questions: Array<{  // 최대 3개
    question: string;
    type: "single_choice" | "multiple_choice";
    options: string[];
    required: boolean;
  }>;
}
```

### 4. campaigns/{campaignId}/applications/{applicationId}
인플루언서 지원 정보

```typescript
{
  influencerId: string;          // users/{uid}
  campaignId: string;            // campaigns/{id} (중복이지만 쿼리 성능 향상)
  message?: string;              // 지원 메시지 (연락처 등 포함 금지, 필터링 필요)
  status: 
    | "APPLIED"      // 지원됨
    | "REJECTED"     // 거절됨
    | "SELECTED";    // 선정됨
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
  selectedAt?: Timestamp;
}
```

### 5. campaigns/{campaignId}/submissions/{submissionId}
인플루언서 증빙 제출

```typescript
{
  influencerId: string;          // users/{uid}
  campaignId: string;            // campaigns/{id}
  applicationId: string;         // applications/{id}
  
  postUrl: string;               // 게시물 URL (필수)
  screenshotUrls: string[];      // Storage 경로 배열
  
  metrics: {                     // 수동 입력 (MVP)
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    engagement_rate?: number;
    reach?: number;
    impressions?: number;
    [key: string]: number | undefined; // 확장 가능
  };
  
  status: 
    | "SUBMITTED"    // 제출됨
    | "NEEDS_FIX"    // 수정 필요
    | "APPROVED";    // 승인됨
  
  submittedAt: Timestamp;
  updatedAt: Timestamp;
  approvedAt?: Timestamp;
  
  feedback?: string;             // 수정 요청 피드백
}
```

### 6. campaigns/{campaignId}/reports/{reportId}
자동 생성된 리포트

```typescript
{
  campaignId: string;
  generatedAt: Timestamp;
  generatedBy: "system" | string; // "system" 또는 users/{uid}
  
  summary: string;               // 요약 텍스트
  kpiResults: {
    metric: string;
    target?: number;
    actual?: number;
    achievement_rate?: number;
  }[];
  
  narrative: string;             // 문장 형태 해석
}
```

### 7. events/{eventId}
감사 로그 (상태 변경 및 중요 이벤트)

```typescript
{
  campaignId?: string;           // 관련 캠페인 (옵션)
  actorId: string;               // users/{uid} 또는 "system"
  actorRole: "advertiser" | "influencer" | "admin" | "system";
  
  type: 
    | "campaign_created"
    | "campaign_generated"
    | "campaign_approved"
    | "campaign_opened"
    | "application_submitted"
    | "influencer_selected"
    | "submission_submitted"
    | "submission_approved"
    | "campaign_completed"
    | "status_changed"
    | "penalty_applied"
    | "deadline_reminder"
    | "deadline_overdue";
  
  payload: {                     // 이벤트별 추가 데이터
    [key: string]: any;
  };
  
  createdAt: Timestamp;
}
```

### 8. penalties/{penaltyId}
페널티 기록

```typescript
{
  campaignId: string;
  influencerId: string;          // users/{uid}
  applicationId?: string;        // applications/{id}
  
  reason: 
    | "deadline_overdue"
    | "submission_rejected"
    | "quality_issue"
    | "policy_violation"
    | "other";
  
  description: string;
  
  penaltyType: 
    | "warning"
    | "budget_deduction"
    | "blacklist_temporary"
    | "blacklist_permanent";
  
  amountOrFlag?: {               // penaltyType에 따라 다름
    amount?: number;
    currency?: string;
    duration_days?: number;      // 임시 블랙리스트 기간
  };
  
  status: 
    | "pending"
    | "applied"
    | "disputed"
    | "resolved";
  
  createdAt: Timestamp;
  appliedAt?: Timestamp;
  resolvedAt?: Timestamp;
  
  appliedBy: string;             // users/{uid} (admin)
}
```

## 인덱스 필요 필드

Firestore에서 복합 쿼리를 위해 인덱스가 필요한 필드들:

1. `campaigns`: 
   - `status` + `createdAt` (DESC)
   - `advertiserId` + `status`
   - `status` + `openedAt`

2. `applications`:
   - `campaignId` + `status` + `createdAt`
   - `influencerId` + `status`

3. `submissions`:
   - `campaignId` + `status`
   - `influencerId` + `status`

4. `events`:
   - `campaignId` + `createdAt` (DESC)
   - `type` + `createdAt` (DESC)

## 쿼리 패턴 예시

### 광고주: 내 캠페인 리스트
```typescript
db.collection('campaigns')
  .where('advertiserId', '==', userId)
  .orderBy('createdAt', 'desc')
```

### 인플루언서: 오픈 캠페인 리스트
```typescript
db.collection('campaigns')
  .where('status', '==', 'OPEN')
  .orderBy('openedAt', 'desc')
```

### 인플루언서: 내 지원 내역
```typescript
db.collectionGroup('applications')
  .where('influencerId', '==', userId)
  .orderBy('createdAt', 'desc')
```

### 운영자: 지연/위험 캠페인
```typescript
db.collection('campaigns')
  .where('status', 'in', ['RUNNING', 'MATCHING'])
  .where('deadlineDate', '<', Timestamp.now())
```

