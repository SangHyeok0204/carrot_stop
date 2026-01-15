export const SYSTEM_PROMPT = `당신은 전문 광고 기획자입니다. 광고주가 자연어로 느낌이나 목적만 설명하면, 
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
- 한국어로 응답하되, JSON은 정확한 형식을 유지해야 합니다.`;

export function getUserPrompt(naturalLanguageInput: string): string {
  return `다음은 광고주가 입력한 자연어 요청입니다:

"${naturalLanguageInput}"

위 요청을 바탕으로 다음을 생성해주세요:

1. **제안서 (proposalMarkdown)**: 
   - 마크다운 형식
   - 제목, 목적, 타겟 오디언스, 추천 콘텐츠 유형, 일정, 예산 범위, 예상 성과 등을 포함
   - 비전문가도 이해할 수 있는 친절한 문체
   - 한국어로 작성

2. **실행 스펙 (specJson)**: 
   - 아래 JSON Schema에 정확히 맞는 형식
   - 모든 필수 필드 포함
   - **title 필드 필수**: 캠페인 제목을 명확하고 간결하게 생성 (10-50자)
   - clarification_questions는 최대 3개, 선택지는 각 2-4개
   - 한국어로 작성하되, JSON 구조는 정확히 유지

3. **확인 질문 (clarification_questions)**:
   - 불명확한 부분이나 중요한 결정 사항을 명확히 하기 위한 질문
   - 단일 선택 또는 복수 선택 형식
   - 광고주가 쉽게 답할 수 있는 구체적인 선택지 제공

응답은 반드시 다음 JSON 형식으로 반환해야 합니다 (모든 필드 필수):
{
  "proposalMarkdown": "# 캠페인 제안서\n\n## 목표\n...(최소 500자 이상의 상세한 마크다운 제안서)...",
  "specJson": {
    "title": "캠페인 제목 (10-50자, 명확하고 간결하게)",
    "objective": "캠페인의 명확한 목표 (20-500자)",
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
}

중요: 위 예시의 모든 필드를 반드시 포함하고, specJson의 각 필드는 정확한 타입을 유지해야 합니다.`;
}

export function getRetryPrompt(errorMessage: string, originalInput: string): string {
  return `이전 요청에서 다음 오류가 발생했습니다:

${errorMessage}

다시 시도해주세요. 원본 요청:

"${originalInput}"

이번에는 JSON Schema에 정확히 맞는 형식으로 응답해주세요.`;
}

