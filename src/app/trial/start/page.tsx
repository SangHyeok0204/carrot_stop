'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SurveyLayout, SurveyQuestion, SurveyOption } from '@/components/survey';

// 질문 데이터 타입 정의
interface SurveyOptionData {
  id: string;
  label: string;
  icon?: string;  // 이모지 또는 아이콘
  image?: string; // 이미지 URL
}

interface SurveyQuestionData {
  id: string;
  icon?: string;
  question: string;
  description?: string;
  options: SurveyOptionData[];
}

// 인플루언서 온보딩 질문 데이터
const SURVEY_QUESTIONS: SurveyQuestionData[] = [
  {
    id: 'sns_channel',
    question: '주로 활동하는 SNS 채널은 무엇인가요?',
    description: '캠페인 채널 매칭에 활용됩니다',
    options: [
      { id: 'instagram', label: '인스타그램' },
      { id: 'youtube', label: '유튜브' },
      { id: 'tiktok', label: '틱톡' },
      { id: 'blog', label: '블로그' },
    ],
  },
  {
    id: 'content_topic',
    question: '가장 집중하고 있는 콘텐츠 주제는 무엇인가요?',
    description: '콘텐츠-브랜드 적합도 판단에 활용됩니다',
    options: [
      { id: 'beauty', label: '뷰티/패션' },
      { id: 'food', label: '푸드/맛집' },
      { id: 'travel', label: '여행/라이프' },
      { id: 'tech', label: '테크/리뷰' },
    ],
  },
  {
    id: 'follower_count',
    question: '팔로워 수 구간은 어디에 해당하나요?',
    description: '캠페인 규모 적합성 판단에 활용됩니다',
    options: [
      { id: 'nano', label: '1천~1만' },
      { id: 'micro', label: '1만~5만' },
      { id: 'mid', label: '5만~10만' },
      { id: 'macro', label: '10만 이상' },
    ],
  },
  {
    id: 'reach_rate',
    question: '평균 게시물 도달률은 어느 정도인가요?',
    description: '실제 광고 노출력 추정에 활용됩니다',
    options: [
      { id: 'low', label: '10% 미만' },
      { id: 'medium', label: '10~30%' },
      { id: 'high', label: '30~50%' },
      { id: 'very_high', label: '50% 이상' },
    ],
  },
  {
    id: 'engagement_rate',
    question: '평균 참여율(좋아요·댓글)은 어느 정도인가요?',
    description: '성과 기반 매칭 점수에 활용됩니다',
    options: [
      { id: 'low', label: '1% 미만' },
      { id: 'medium', label: '1~3%' },
      { id: 'high', label: '3~5%' },
      { id: 'very_high', label: '5% 이상' },
    ],
  },
  {
    id: 'campaign_goal',
    question: '선호하는 광고 캠페인의 목적은 무엇인가요?',
    description: '광고 목적 일치도 판단에 활용됩니다',
    options: [
      { id: 'awareness', label: '브랜드 인지도' },
      { id: 'traffic', label: '방문 유도' },
      { id: 'conversion', label: '구매 전환' },
      { id: 'followers', label: '팔로우 유도' },
    ],
  },
  {
    id: 'ad_style',
    question: '어떤 광고 스타일을 선호하시나요?',
    description: '광고 톤 매칭에 활용됩니다',
    options: [
      { id: 'natural', label: '자연스러운 콘텐츠형' },
      { id: 'clear', label: '명확한 홍보형' },
      { id: 'mixed', label: '상황에 따라' },
      { id: 'no_preference', label: '상관없음' },
    ],
  },
  {
    id: 'content_format',
    question: '주로 제작 가능한 콘텐츠 형식은 무엇인가요?',
    description: '콘텐츠 타입 적합성 판단에 활용됩니다',
    options: [
      { id: 'image', label: '이미지/카드뉴스' },
      { id: 'short_video', label: '숏폼 영상' },
      { id: 'long_video', label: '롱폼 영상' },
      { id: 'text', label: '텍스트/블로그' },
    ],
  },
  {
    id: 'preferred_budget',
    question: '선호하는 광고 예산 범위는 어디인가요?',
    description: '예산 미스매치 방지에 활용됩니다',
    options: [
      { id: 'small', label: '30만원 미만' },
      { id: 'medium', label: '30~100만원' },
      { id: 'large', label: '100~300만원' },
      { id: 'premium', label: '300만원 이상' },
    ],
  },
  {
    id: 'production_time',
    question: '콘텐츠 제작에 평균적으로 필요한 기간은?',
    description: '일정 충돌 방지에 활용됩니다',
    options: [
      { id: 'short', label: '1~3일' },
      { id: 'medium', label: '3~7일' },
      { id: 'long', label: '1~2주' },
      { id: 'very_long', label: '2주 이상' },
    ],
  },
  {
    id: 'excluded_industry',
    question: '협업을 피하고 싶은 업종이 있나요?',
    description: '광고 제외 조건 설정에 활용됩니다',
    options: [
      { id: 'none', label: '없음' },
      { id: 'gambling', label: '도박/성인' },
      { id: 'health', label: '건강기능식품' },
      { id: 'politics', label: '정치/종교' },
    ],
  },
  {
    id: 'review_preference',
    question: '사전 검수/수정 요청에 대한 선호도는?',
    description: '협업 난이도 예측에 활용됩니다',
    options: [
      { id: 'flexible', label: '유연하게 대응' },
      { id: 'limited', label: '1~2회까지' },
      { id: 'strict', label: '최소화 희망' },
      { id: 'no_revision', label: '수정 불가' },
    ],
  },
  {
    id: 'collaboration_type',
    question: '단발성 광고와 장기 협업 중 선호하는 것은?',
    description: '협업 구조 추천에 활용됩니다',
    options: [
      { id: 'one_time', label: '단발성 광고' },
      { id: 'long_term', label: '장기 협업' },
      { id: 'both', label: '둘 다 좋음' },
      { id: 'depends', label: '조건에 따라' },
    ],
  },
  {
    id: 'channel_image',
    question: '채널이 전달하고 싶은 핵심 이미지는?',
    description: '브랜드 이미지 일치도 판단에 활용됩니다',
    options: [
      { id: 'professional', label: '전문적/신뢰감' },
      { id: 'friendly', label: '친근함/편안함' },
      { id: 'trendy', label: '트렌디/힙함' },
      { id: 'luxury', label: '고급스러움' },
    ],
  },
  {
    id: 'follower_age',
    question: '팔로워 연령대의 주 비중은 어디인가요?',
    description: '타깃 오디언스 매칭에 활용됩니다',
    options: [
      { id: 'teen', label: '10대' },
      { id: 'twenties', label: '20대' },
      { id: 'thirties', label: '30대' },
      { id: 'forties_plus', label: '40대 이상' },
    ],
  },
  {
    id: 'follower_gender',
    question: '팔로워 성별 비중은 어떻게 되나요?',
    description: '타깃 적합성 판단에 활용됩니다',
    options: [
      { id: 'male_dominant', label: '남성 위주' },
      { id: 'female_dominant', label: '여성 위주' },
      { id: 'balanced', label: '비슷함' },
      { id: 'unknown', label: '잘 모름' },
    ],
  },
  {
    id: 'priority_factor',
    question: '광고 콘텐츠에서 가장 중요한 요소는?',
    description: '광고 성과 우선순위 파악에 활용됩니다',
    options: [
      { id: 'creativity', label: '창의성' },
      { id: 'authenticity', label: '진정성' },
      { id: 'performance', label: '성과/전환' },
      { id: 'brand_fit', label: '브랜드 적합성' },
    ],
  },
  {
    id: 'pain_point',
    question: '캠페인 참여 시 가장 부담되는 요소는?',
    description: '이탈/실패 리스크 예측에 활용됩니다',
    options: [
      { id: 'deadline', label: '촉박한 일정' },
      { id: 'revision', label: '잦은 수정 요청' },
      { id: 'low_budget', label: '낮은 예산' },
      { id: 'mismatch', label: '브랜드 불일치' },
    ],
  },
  {
    id: 'growth_direction',
    question: '향후 어떤 방향으로 성장하고 싶나요?',
    description: '단기 vs 장기 광고 추천에 활용됩니다',
    options: [
      { id: 'mega', label: '메가 인플루언서' },
      { id: 'expert', label: '전문 크리에이터' },
      { id: 'brand', label: '개인 브랜드 론칭' },
      { id: 'stable', label: '안정적 수익화' },
    ],
  },
  {
    id: 'collab_style',
    question: '광고주에게 알려주고 싶은 협업 스타일은?',
    description: '브리프 자동 생성 보조 정보로 활용됩니다',
    options: [
      { id: 'autonomous', label: '자율적 제작' },
      { id: 'collaborative', label: '긴밀한 소통' },
      { id: 'guided', label: '가이드 기반' },
      { id: 'flexible', label: '유연하게' },
    ],
  },
];

export default function TrialStartPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const totalSteps = SURVEY_QUESTIONS.length;
  const currentQuestion = SURVEY_QUESTIONS[currentStep - 1];

  // 옵션 선택 핸들러
  const handleOptionSelect = (optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionId,
    }));

    // 짧은 딜레이 후 다음 단계로
    setTimeout(() => {
      if (currentStep < totalSteps) {
        setCurrentStep((prev) => prev + 1);
      } else {
        // 마지막 질문 완료 → 결과 처리
        handleComplete();
      }
    }, 300);
  };

  // 이전 단계
  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // 건너뛰기
  const handleSkip = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  // 설문 완료
  const handleComplete = () => {
    // TODO: 응답 데이터 저장 로직
    console.log('Survey answers:', answers);

    // 회원가입 페이지로 이동
    router.push('/auth/signup');
  };

  return (
    <SurveyLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      onPrevious={handlePrevious}
      onSkip={handleSkip}
      showPrevious={currentStep > 1}
    >
      {/* 질문 */}
      <SurveyQuestion
        icon={currentQuestion.icon}
        question={currentQuestion.question}
        description={currentQuestion.description}
      />

      {/* 선택지 */}
      <div className="mt-12 w-full max-w-2xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 justify-items-center">
          {currentQuestion.options.map((option) => (
            <SurveyOption
              key={option.id}
              id={option.id}
              label={option.label}
              icon={option.icon}
              image={option.image}
              selected={answers[currentQuestion.id] === option.id}
              onClick={handleOptionSelect}
            />
          ))}
        </div>
      </div>
    </SurveyLayout>
  );
}
