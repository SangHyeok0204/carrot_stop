import { SurveyAnswer } from '@/types/survey';
import { CampaignCategoryId } from './constants';

/**
 * 설문 결과 분석 및 추출
 */
export interface SurveyAnalysis {
  preferredCategories: CampaignCategoryId[];
  preferredChannels: string[];
  budgetPreference?: string;
  contentStyle?: string;
  experienceLevel?: string;
}

/**
 * 설문 응답을 분석하여 사용자 선호도 추출
 */
export function analyzeSurveyAnswers(answers: SurveyAnswer[]): SurveyAnalysis {
  const analysis: SurveyAnalysis = {
    preferredCategories: [],
    preferredChannels: [],
  };

  // 질문 ID 기반으로 응답 분석
  for (const answer of answers) {
    const { questionId, answer: answerValue } = answer;
    const answerStr = Array.isArray(answerValue) ? answerValue[0] : answerValue;

    // 카테고리 선호도 (질문 ID에 따라 매핑)
    if (questionId.includes('category') || questionId.includes('interest')) {
      const category = mapAnswerToCategory(answerStr);
      if (category && !analysis.preferredCategories.includes(category)) {
        analysis.preferredCategories.push(category);
      }
    }

    // 채널 선호도
    if (questionId.includes('platform') || questionId.includes('channel')) {
      const channel = mapAnswerToChannel(answerStr);
      if (channel && !analysis.preferredChannels.includes(channel)) {
        analysis.preferredChannels.push(channel);
      }
    }

    // 예산 선호도
    if (questionId.includes('budget')) {
      analysis.budgetPreference = answerStr;
    }

    // 콘텐츠 스타일
    if (questionId.includes('style') || questionId.includes('content')) {
      analysis.contentStyle = answerStr;
    }

    // 경험 수준
    if (questionId.includes('experience') || questionId.includes('level')) {
      analysis.experienceLevel = answerStr;
    }
  }

  return analysis;
}

/**
 * 응답 값을 카테고리로 매핑
 */
function mapAnswerToCategory(answer: string): CampaignCategoryId | null {
  const lower = answer.toLowerCase();
  
  const categoryMap: Record<string, CampaignCategoryId> = {
    '카페': '카페',
    'cafe': '카페',
    'coffee': '카페',
    '음식': '음식점',
    '음식점': '음식점',
    'restaurant': '음식점',
    'food': '음식점',
    '뷰티': '뷰티/미용',
    '미용': '뷰티/미용',
    'beauty': '뷰티/미용',
    '패션': '패션/의류',
    '의류': '패션/의류',
    'fashion': '패션/의류',
    '스포츠': '스포츠/피트니스',
    '피트니스': '스포츠/피트니스',
    'sports': '스포츠/피트니스',
    'fitness': '스포츠/피트니스',
    '페스티벌': '페스티벌/행사',
    '행사': '페스티벌/행사',
    'festival': '페스티벌/행사',
    'event': '페스티벌/행사',
  };

  for (const [key, category] of Object.entries(categoryMap)) {
    if (lower.includes(key)) {
      return category;
    }
  }

  return null;
}

/**
 * 응답 값을 채널로 매핑
 */
function mapAnswerToChannel(answer: string): string | null {
  const lower = answer.toLowerCase();
  
  if (lower.includes('instagram') || lower.includes('인스타')) {
    return 'Instagram';
  }
  if (lower.includes('youtube') || lower.includes('유튜브')) {
    return 'YouTube';
  }
  if (lower.includes('tiktok') || lower.includes('틱톡')) {
    return 'TikTok';
  }

  return null;
}

/**
 * 설문 결과를 기반으로 캠페인 추천 점수 계산
 */
export function calculateRecommendationScore(
  campaign: { category?: string; channel?: string },
  analysis: SurveyAnalysis
): number {
  let score = 0;

  // 카테고리 매칭
  if (campaign.category && analysis.preferredCategories.includes(campaign.category as CampaignCategoryId)) {
    score += 3;
  }

  // 채널 매칭
  if (campaign.channel && analysis.preferredChannels.includes(campaign.channel)) {
    score += 2;
  }

  return score;
}

