import { CampaignCategoryId } from './constants';

/**
 * 카테고리 정규화 함수
 * 다양한 형태의 카테고리 값을 표준 CampaignCategoryId로 변환
 */
export function normalizeCategory(category: string | undefined | null): CampaignCategoryId {
  if (!category) return '기타';

  const normalized = category.trim();

  // 정확한 매칭
  const validCategories: CampaignCategoryId[] = [
    '카페',
    '음식점',
    '바/주점',
    '뷰티/미용',
    '패션/의류',
    '스포츠/피트니스',
    '페스티벌/행사',
    '서포터즈',
    '리뷰/체험단',
    '기타',
  ];

  if (validCategories.includes(normalized as CampaignCategoryId)) {
    return normalized as CampaignCategoryId;
  }

  // 유사 매칭 (대소문자 무시, 공백 무시)
  const lowerNormalized = normalized.toLowerCase().replace(/\s+/g, '');

  const categoryMap: Record<string, CampaignCategoryId> = {
    '카페': '카페',
    'cafe': '카페',
    'coffee': '카페',
    '음식점': '음식점',
    'restaurant': '음식점',
    'food': '음식점',
    '바': '바/주점',
    '주점': '바/주점',
    'bar': '바/주점',
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
    '서포터즈': '서포터즈',
    'supporter': '서포터즈',
    '리뷰': '리뷰/체험단',
    '체험단': '리뷰/체험단',
    'review': '리뷰/체험단',
  };

  if (categoryMap[lowerNormalized]) {
    return categoryMap[lowerNormalized];
  }

  // 기본값
  return '기타';
}

/**
 * 카테고리 배열에서 첫 번째 유효한 카테고리 추출
 */
export function extractCategory(categories: string[] | undefined | null): CampaignCategoryId {
  if (!categories || categories.length === 0) {
    return '기타';
  }

  for (const cat of categories) {
    const normalized = normalizeCategory(cat);
    if (normalized !== '기타') {
      return normalized;
    }
  }

  return '기타';
}

