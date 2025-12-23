# LLM 프롬프트 설계

## 1. System Prompt

```
당신은 전문 광고 기획자입니다. 광고주가 자연어로 느낌이나 목적만 설명하면, 
실행 가능한 광고 캠페인 기획서를 작성합니다.

당신의 역할:
1. 광고주의 자연어 입력을 분석하여 캠페인 목적과 타겟을 파악
2. 사람이 읽기 쉬운 마크다운 형식의 제안서 작성
3. 플랫폼이 실행할 수 있는 구조화된 JSON 스펙 생성

중요 원칙:
- 광고주가 전문 용어를 몰라도 이해할 수 있는 제안서 작성
- 현실적이고 실행 가능한 계획 수립
- 리스크를 명확히 식별하고 완화 방안 제시
- 최대 3개의 확인 질문으로 불명확한 부분을 명확히 할 수 있도록 함
- 예산과 KPI는 타겟 오디언스와 목적에 맞게 합리적으로 제안
```

## 2. User Prompt Template

```
다음은 광고주가 입력한 자연어 요청입니다:

"{naturalLanguageInput}"

위 요청을 바탕으로 다음을 생성해주세요:

1. **제안서 (proposalMarkdown)**: 
   - 마크다운 형식
   - 제목, 목적, 타겟 오디언스, 추천 콘텐츠 유형, 일정, 예산 범위, 예상 성과 등을 포함
   - 비전문가도 이해할 수 있는 친절한 문체

2. **실행 스펙 (specJson)**: 
   - 아래 JSON Schema에 정확히 맞는 형식
   - 모든 필수 필드 포함
   - clarification_questions는 최대 3개, 선택지는 각 2-4개

3. **확인 질문 (clarification_questions)**:
   - 불명확한 부분이나 중요한 결정 사항을 명확히 하기 위한 질문
   - 단일 선택 또는 복수 선택 형식
   - 광고주가 쉽게 답할 수 있는 구체적인 선택지 제공

응답은 반드시 다음 JSON 형식으로 반환해야 합니다:
{
  "proposalMarkdown": "...",
  "specJson": { ... }
}
```

## 3. JSON Schema (Zod)

```typescript
import { z } from 'zod';

export const ClarificationQuestionSchema = z.object({
  question: z.string().min(10).max(200),
  type: z.enum(['single_choice', 'multiple_choice']),
  options: z.array(z.string().min(1).max(50)).min(2).max(4),
  required: z.boolean(),
});

export const TargetAudienceSchema = z.object({
  demographics: z.string().optional(),
  interests: z.array(z.string()).optional(),
  behaviors: z.array(z.string()).optional(),
});

export const ContentTypeSchema = z.object({
  platform: z.string(), // instagram, youtube, tiktok, blog, twitter 등
  format: z.string(),   // post, story, reel, video, article 등
  rationale: z.string().optional(),
});

export const ScheduleSchema = z.object({
  estimated_duration_days: z.number().int().positive(),
  milestones: z.array(z.object({
    phase: z.string(),
    days_from_start: z.number().int().nonnegative(),
  })).optional(),
});

export const BudgetRangeSchema = z.object({
  min: z.number().nonnegative(),
  max: z.number().nonnegative(),
  currency: z.string().default('KRW'),
  rationale: z.string(),
});

export const KPISchema = z.object({
  metric: z.string(),
  value: z.number().nonnegative(),
  source: z.string().optional(),
});

export const KPIGroupSchema = z.object({
  guaranteed: z.array(KPISchema).optional(),
  target: z.array(KPISchema).optional(),
  reference: z.array(KPISchema).optional(),
});

export const RiskFlagSchema = z.object({
  level: z.enum(['low', 'medium', 'high']),
  description: z.string(),
  mitigation: z.string().optional(),
});

export const CampaignSpecSchema = z.object({
  objective: z.string().min(20).max(500),
  target_audience: TargetAudienceSchema,
  tone_and_mood: z.array(z.string()).min(1),
  recommended_content_types: z.array(ContentTypeSchema).min(1),
  schedule: ScheduleSchema,
  budget_range: BudgetRangeSchema,
  kpis: KPIGroupSchema,
  constraints: z.object({
    must_have: z.array(z.string()).optional(),
    must_not: z.array(z.string()).optional(),
  }),
  risk_flags: z.array(RiskFlagSchema).optional(),
  clarification_questions: z.array(ClarificationQuestionSchema).max(3),
});

export const LLMResponseSchema = z.object({
  proposalMarkdown: z.string().min(500),
  specJson: CampaignSpecSchema,
});
```

## 4. Validation & Retry 전략

### 검증 로직
1. JSON 파싱 검증
2. Zod Schema 검증
3. 필수 필드 존재 확인
4. 값 범위 검증 (예: 예산 min <= max)

### 재시도 전략
- 최대 2회 재시도
- 1차 실패 시: "JSON Schema에 맞게 다시 생성해주세요. 다음 필드들이 누락되었거나 형식이 맞지 않습니다: [필드 목록]"
- 2차 실패 시: 더 구체적인 에러 메시지와 함께 재프롬프트
- 3차 실패 시: 에러 반환하고 수동 검토 필요 알림

### 에러 처리
- LLM API 타임아웃: 30초 타임아웃 설정
- Rate Limit: 429 에러 시 exponential backoff
- Invalid Response: 위 재시도 로직 적용

## 5. 예시 입력/출력

### 입력 예시
```
"우리 회사의 새로운 헤어케어 제품을 20-30대 여성들에게 알리고 싶어요. 
자연스럽고 건강한 느낌으로 소개하고 싶은데, 너무 과하지 않게요."
```

### 출력 예시 (specJson 일부)
```json
{
  "objective": "20-30대 여성을 타겟으로 한 새로운 헤어케어 제품의 자연스럽고 건강한 이미지 구축 및 브랜드 인지도 향상",
  "target_audience": {
    "demographics": "20-30대 여성",
    "interests": ["뷰티", "헤어케어", "라이프스타일", "자기계발"],
    "behaviors": ["소셜미디어 활성", "인플루언서 콘텐츠 소비", "온라인 쇼핑"]
  },
  "tone_and_mood": ["자연스러운", "건강한", "친근한", "트렌디한"],
  "recommended_content_types": [
    {
      "platform": "instagram",
      "format": "post",
      "rationale": "타겟 오디언스의 주요 사용 플랫폼"
    },
    {
      "platform": "instagram",
      "format": "story",
      "rationale": "일상적이고 자연스러운 노출"
    }
  ],
  "schedule": {
    "estimated_duration_days": 14,
    "milestones": [
      {"phase": "콘텐츠 제작", "days_from_start": 0},
      {"phase": "게시", "days_from_start": 7},
      {"phase": "성과 분석", "days_from_start": 14}
    ]
  },
  "budget_range": {
    "min": 500000,
    "max": 1500000,
    "currency": "KRW",
    "rationale": "20-30대 타겟 인플루언서 2-3명 기준, 플랫폼별 적정 예산 범위"
  },
  "kpis": {
    "target": [
      {"metric": "reach", "value": 50000},
      {"metric": "engagement_rate", "value": 3.5}
    ],
    "reference": [
      {"metric": "industry_average_engagement", "value": 2.8, "source": "업계 평균"}
    ]
  },
  "constraints": {
    "must_have": ["제품 사용 전후 비교", "자연스러운 일상 연출"],
    "must_not": ["과도한 연출", "비자연스러운 광고 문구"]
  },
  "risk_flags": [
    {
      "level": "low",
      "description": "타겟 오디언스의 플랫폼 선호도 변경 가능성",
      "mitigation": "다양한 플랫폼 콘텐츠 타입 제안"
    }
  ],
  "clarification_questions": [
    {
      "question": "제품의 주요 포인트는 무엇인가요?",
      "type": "single_choice",
      "options": ["자연 성분", "효과 (예: 모발 강화)", "사용 편의성", "디자인/패키징"],
      "required": true
    },
    {
      "question": "어떤 톤으로 소개하고 싶으신가요?",
      "type": "single_choice",
      "options": ["친구처럼 편하게", "전문가 추천 느낌", "일상 기록 느낌", "트렌드 리더 느낌"],
      "required": true
    }
  ]
}
```

