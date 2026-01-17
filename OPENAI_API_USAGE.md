# OpenAI API 활용 기능 정리

> **작성일**: 2026년 1월 15일  
> **사용 모델**: GPT-4 Turbo Preview  
> **활용 기능**: 2가지

---

## 📋 목차

1. [캠페인 스펙 자동 생성](#1-캠페인-스펙-자동-생성)
2. [캠페인 리포트 자동 생성](#2-캠페인-리포트-자동-생성)

---

## 1. 캠페인 스펙 자동 생성

### 📍 위치
- **API 엔드포인트**: `POST /api/campaigns/generate`
- **LLM 클라이언트**: `src/lib/llm/client.ts`
- **프롬프트**: `src/lib/llm/prompts.ts`
- **스키마**: `src/lib/llm/schema.ts`

### 🎯 기능 설명

**광고주가 자연어로 느낌이나 목적만 설명하면, LLM이 실행 가능한 광고 캠페인 기획서를 자동으로 생성합니다.**

#### 입력
광고주가 입력하는 자연어 텍스트:
```
"20대 여성을 타겟으로 하는 화장품 신제품 런칭 캠페인"
```

#### 처리 과정

1. **프롬프트 구성**
   - System Prompt: 전문 광고 기획자 역할 부여
   - User Prompt: 자연어 입력을 구조화된 기획서로 변환 요청

2. **LLM 호출**
   - 모델: `gpt-4-turbo-preview`
   - Temperature: 0.7 (창의성과 일관성의 균형)
   - Max Tokens: 4000
   - Response Format: JSON Object (구조화된 응답 보장)

3. **응답 검증**
   - JSON 파싱
   - Zod Schema 검증 (`LLMResponseSchema`)
   - 최대 2회 재시도 (실패 시)

4. **결과 저장**
   - 캠페인 문서 생성
   - Spec 버전 저장
   - 이벤트 기록

#### 출력

**1. 제안서 (proposalMarkdown)**
- 마크다운 형식의 사람이 읽기 쉬운 제안서
- 최소 500자 이상
- 포함 내용:
  - 캠페인 제목
  - 목적 및 목표
  - 타겟 오디언스 분석
  - 추천 콘텐츠 유형
  - 일정 및 마일스톤
  - 예산 범위 및 근거
  - 예상 성과 및 KPI
  - 리스크 식별 및 완화 방안

**2. 실행 스펙 (specJson)**
구조화된 JSON 형식의 실행 가능한 스펙:

```json
{
  "title": "화장품 신제품 런칭 캠페인",
  "objective": "20대 여성 타겟으로 신제품 인지도 향상 및 구매 전환",
  "target_audience": {
    "demographics": "20-30대 여성, 직장인",
    "interests": ["뷰티", "패션", "라이프스타일"],
    "behaviors": ["온라인 쇼핑 선호", "SNS 활발 사용"]
  },
  "tone_and_mood": ["밝은", "친근한", "트렌디"],
  "recommended_content_types": [
    {
      "platform": "Instagram",
      "format": "릴스",
      "rationale": "20대 여성 타겟에 적합한 숏폼 콘텐츠"
    }
  ],
  "schedule": {
    "estimated_duration_days": 30,
    "milestones": [
      {"phase": "인플루언서 섭외", "days_from_start": 0},
      {"phase": "콘텐츠 제작", "days_from_start": 7},
      {"phase": "콘텐츠 업로드", "days_from_start": 14}
    ]
  },
  "budget_range": {
    "min": 1000000,
    "max": 3000000,
    "currency": "KRW",
    "rationale": "중소규모 캠페인 기준, 인플루언서 3-5명 협업 예상"
  },
  "kpis": {
    "guaranteed": [
      {"metric": "총 조회수", "value": 50000}
    ],
    "target": [
      {"metric": "댓글 수", "value": 500}
    ]
  },
  "constraints": {
    "must_have": ["브랜드 로고 노출", "제품 사용 장면"],
    "must_not": ["경쟁사 언급", "과장 표현"]
  },
  "risk_flags": [
    {
      "level": "low",
      "description": "시즌 영향으로 참여율 변동 가능",
      "mitigation": "유연한 일정 조정"
    }
  ],
  "clarification_questions": [
    {
      "question": "주요 홍보하고 싶은 제품의 특장점은 무엇인가요?",
      "type": "single_choice",
      "options": ["가성비", "품질", "디자인", "기능성"],
      "required": true
    }
  ]
}
```

#### 주요 특징

1. **자동 제목 생성**
   - `specJson.title` 필드에서 추출
   - 없으면 제안서 마크다운에서 추출
   - 최후의 수단으로 `objective` 사용 (100자 제한)

2. **확인 질문 생성**
   - 최대 3개의 확인 질문
   - 단일 선택 또는 복수 선택 형식
   - 각 질문당 2-4개의 선택지

3. **에러 처리 및 재시도**
   - 최대 2회 재시도
   - Zod 검증 실패 시 상세한 에러 메시지
   - JSON 파싱 실패 시 재시도

4. **일정 자동 계산**
   - `estimated_duration_days`를 기반으로 `deadlineDate` 자동 설정

#### 사용 흐름

```
1. 광고주: 자연어 입력
   ↓
2. API: LLM 호출 (generateCampaignSpec)
   ↓
3. LLM: 제안서 + 스펙 생성
   ↓
4. API: 검증 및 저장
   ↓
5. 광고주: 제안서 검토 및 확인 질문 답변 (선택)
   ↓
6. 광고주: 승인 → 캠페인 오픈
```

#### 권한
- **advertiser**만 사용 가능

---

## 2. 캠페인 리포트 자동 생성

### 📍 위치
- **API 엔드포인트**: `GET /api/cron/generate-reports`
- **실행 주기**: 매일 오후 6시 (UTC)
- **Cron 작업**: Vercel Cron Jobs

### 🎯 기능 설명

**완료된 캠페인의 KPI 데이터를 분석하여 LLM이 성과 리포트를 자동으로 요약 생성합니다.**

#### 입력
- 완료된 캠페인 (`status === 'COMPLETED'`)
- 승인된 제출물 (`status === 'APPROVED'`)
- 제출물의 메트릭 데이터 (views, likes, comments 등)

#### 처리 과정

1. **완료된 캠페인 조회**
   - 리포트가 없는 캠페인만 처리

2. **KPI 집계**
   - 모든 승인된 제출물의 메트릭 집계
   - 평균값 계산
   - 총합 계산

3. **LLM 호출**
   - 모델: `gpt-4-turbo-preview`
   - Max Tokens: 500
   - System Prompt: "캠페인 리포트를 문장 형태로 요약해주세요."
   - User Prompt: KPI 결과 데이터를 JSON 형식으로 전달

4. **리포트 저장**
   - `campaigns/{campaignId}/reports` 서브컬렉션에 저장
   - KPI 결과와 LLM 생성 narrative 포함

#### 출력

**리포트 구조**:
```json
{
  "campaignId": "campaign-id",
  "generatedAt": "2026-01-15T18:00:00Z",
  "generatedBy": "system",
  "summary": "5개의 제출물이 승인되었습니다.",
  "kpiResults": [
    {
      "metric": "views",
      "actual": 150000,
      "average": 30000
    },
    {
      "metric": "likes",
      "actual": 7500,
      "average": 1500
    }
  ],
  "narrative": "이 캠페인은 총 15만 건의 조회수를 달성하며, 평균 3만 건의 조회수를 기록했습니다. 좋아요는 총 7,500개로 평균 1,500개를 기록하여 높은 참여율을 보였습니다."
}
```

#### 주요 특징

1. **자동 실행**
   - 매일 오후 6시 (UTC) 자동 실행
   - Vercel Cron Jobs로 스케줄링

2. **중복 방지**
   - 이미 리포트가 있는 캠페인은 건너뜀

3. **에러 처리**
   - LLM 호출 실패 시 기본 메시지 사용
   - 리포트 생성은 계속 진행

4. **KPI 집계**
   - 숫자형 메트릭만 집계
   - 평균값과 총합 제공

#### 사용 흐름

```
1. Cron Job: 매일 오후 6시 실행
   ↓
2. 완료된 캠페인 조회
   ↓
3. 각 캠페인별로:
   - 승인된 제출물 조회
   - KPI 집계
   - LLM으로 narrative 생성
   - 리포트 저장
   ↓
4. 결과 반환
```

#### 권한
- **Cron Secret** 인증 필요
- 시스템 자동 실행

---

## 📊 OpenAI API 사용 통계

### 사용 모델
- **모델명**: `gpt-4-turbo-preview`
- **사용 위치**: 2곳

### API 호출 빈도

1. **캠페인 스펙 생성**
   - 사용자 요청 시마다 호출
   - 광고주가 새 캠페인 생성할 때마다
   - 예상: 일일 수십~수백 건

2. **리포트 생성**
   - 매일 오후 6시 (UTC) 자동 실행
   - 완료된 캠페인 수만큼 호출
   - 예상: 일일 수십 건

### 비용 예상

**캠페인 스펙 생성**:
- 입력: 약 100-500 토큰
- 출력: 약 2000-4000 토큰
- 총: 약 2500-4500 토큰/요청

**리포트 생성**:
- 입력: 약 200-500 토큰
- 출력: 약 100-500 토큰
- 총: 약 300-1000 토큰/요청

---

## 🔧 설정 및 환경변수

### 필수 환경변수
```env
OPENAI_API_KEY=sk-...
```

### 설정 위치
- `.env.local` (로컬 개발)
- Vercel Environment Variables (프로덕션)

---

## ⚠️ 주의사항

### 1. API 키 보안
- 서버 사이드에서만 사용
- 클라이언트에 노출되지 않음
- 환경변수로 관리

### 2. 에러 처리
- API 키가 없으면 명확한 에러 메시지
- LLM 호출 실패 시 재시도 (캠페인 생성)
- 리포트 생성 실패 시 기본 메시지 사용

### 3. 비용 관리
- GPT-4 Turbo는 상대적으로 비용이 높음
- 캠페인 생성 시 최대 2회 재시도 (비용 증가 가능)
- 리포트 생성은 실패해도 계속 진행

### 4. 응답 검증
- Zod Schema로 엄격한 검증
- JSON 형식 보장 (`response_format: { type: 'json_object' }`)
- 필수 필드 누락 시 재시도

---

## 🚀 향후 확장 가능성

### 현재 미구현이지만 가능한 기능

1. **캠페인 스펙 수정 제안**
   - 기존 스펙을 LLM이 분석하여 개선 제안

2. **인플루언서 매칭 추천**
   - 캠페인 스펙과 인플루언서 프로필을 LLM이 분석하여 매칭 점수 계산

3. **콘텐츠 아이디어 생성**
   - 캠페인 스펙을 바탕으로 구체적인 콘텐츠 아이디어 제안

4. **성과 분석 및 인사이트**
   - 완료된 캠페인 데이터를 LLM이 분석하여 인사이트 제공

5. **고객 문의 자동 응답**
   - 문의 내용을 LLM이 분석하여 자동 응답 초안 생성

---

## 📝 결론

**현재 OpenAI API는 2가지 핵심 기능에 활용되고 있습니다:**

1. ✅ **캠페인 스펙 자동 생성** - 광고주가 자연어로 입력하면 전문 기획서 생성
2. ✅ **캠페인 리포트 자동 생성** - 완료된 캠페인의 성과를 자동으로 요약

두 기능 모두 **GPT-4 Turbo Preview** 모델을 사용하며, 구조화된 JSON 응답을 보장하기 위해 `response_format: { type: 'json_object' }`를 사용합니다.

**구현 완료도**: 100% ✅  
**추가 확장 가능**: 위의 "향후 확장 가능성" 참고

---

**작성일**: 2026년 1월 15일  
**최종 확인**: LLM 관련 코드 전체 스캔 완료
