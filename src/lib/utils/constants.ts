// ============================================
// Campaign Status
// ============================================

export const CAMPAIGN_STATUS_LABELS: Record<string, string> = {
  DRAFT: '초안',
  GENERATED: '생성됨',
  REVIEWED: '검토 중',
  CLARIFYING: '확인 질문 답변 대기',
  APPROVED: '승인됨',
  OPEN: '모집 중',
  MATCHING: '인플루언서 선정 중',
  RUNNING: '집행 중',
  IN_PROGRESS: '진행 중',
  COMPLETED: '완료',
  FAILED: '실패',
  CANCELLED: '취소됨',
};

export const CAMPAIGN_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  DRAFT: { bg: 'bg-gray-100', text: 'text-gray-600' },
  GENERATED: { bg: 'bg-blue-100', text: 'text-blue-600' },
  REVIEWED: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  CLARIFYING: { bg: 'bg-orange-100', text: 'text-orange-600' },
  APPROVED: { bg: 'bg-teal-100', text: 'text-teal-600' },
  OPEN: { bg: 'bg-green-500', text: 'text-white' },
  MATCHING: { bg: 'bg-indigo-100', text: 'text-indigo-600' },
  RUNNING: { bg: 'bg-purple-500', text: 'text-white' },
  IN_PROGRESS: { bg: 'bg-purple-500', text: 'text-white' },
  COMPLETED: { bg: 'bg-slate-400', text: 'text-white' },
  FAILED: { bg: 'bg-red-100', text: 'text-red-600' },
  CANCELLED: { bg: 'bg-red-400', text: 'text-white' },
};

// ============================================
// Application Status
// ============================================

export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  APPLIED: '지원됨',
  REJECTED: '거절됨',
  SELECTED: '선정됨',
};

export const APPLICATION_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  APPLIED: { bg: 'bg-blue-100', text: 'text-blue-600' },
  REJECTED: { bg: 'bg-red-100', text: 'text-red-600' },
  SELECTED: { bg: 'bg-green-100', text: 'text-green-600' },
};

// ============================================
// Submission Status
// ============================================

export const SUBMISSION_STATUS_LABELS: Record<string, string> = {
  SUBMITTED: '제출됨',
  NEEDS_FIX: '수정 필요',
  APPROVED: '승인됨',
};

export const SUBMISSION_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  SUBMITTED: { bg: 'bg-blue-100', text: 'text-blue-600' },
  NEEDS_FIX: { bg: 'bg-orange-100', text: 'text-orange-600' },
  APPROVED: { bg: 'bg-green-100', text: 'text-green-600' },
};

// ============================================
// User Roles
// ============================================

export const ROLE_LABELS: Record<string, string> = {
  advertiser: '광고주',
  influencer: '인플루언서',
  admin: '관리자',
};

export const ROLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  advertiser: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  influencer: {
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    border: 'border-purple-200',
  },
  admin: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
  },
};

// ============================================
// Campaign Categories
// ============================================

export type CampaignCategoryId =
  | '카페'
  | '음식점'
  | '바/주점'
  | '뷰티/미용'
  | '패션/의류'
  | '스포츠/피트니스'
  | '페스티벌/행사'
  | '서포터즈'
  | '리뷰/체험단'
  | '기타';

export const CAMPAIGN_CATEGORIES: { id: CampaignCategoryId; name: string }[] = [
  { id: '카페', name: '카페' },
  { id: '음식점', name: '음식점' },
  { id: '바/주점', name: '바/주점' },
  { id: '뷰티/미용', name: '뷰티/미용' },
  { id: '패션/의류', name: '패션/의류' },
  { id: '스포츠/피트니스', name: '스포츠' },
  { id: '페스티벌/행사', name: '페스티벌' },
  { id: '서포터즈', name: '서포터즈' },
  { id: '리뷰/체험단', name: '리뷰/체험단' },
  { id: '기타', name: '기타' },
];

export const CATEGORY_COLORS: Record<CampaignCategoryId, { bg: string; text: string; gradient: string }> = {
  '카페': { bg: 'bg-amber-100', text: 'text-amber-700', gradient: 'from-amber-400 to-orange-300' },
  '음식점': { bg: 'bg-orange-100', text: 'text-orange-700', gradient: 'from-orange-400 to-red-300' },
  '바/주점': { bg: 'bg-purple-100', text: 'text-purple-700', gradient: 'from-purple-400 to-violet-300' },
  '뷰티/미용': { bg: 'bg-pink-100', text: 'text-pink-700', gradient: 'from-pink-400 to-rose-300' },
  '패션/의류': { bg: 'bg-rose-100', text: 'text-rose-700', gradient: 'from-rose-400 to-pink-300' },
  '스포츠/피트니스': { bg: 'bg-green-100', text: 'text-green-700', gradient: 'from-green-400 to-emerald-300' },
  '페스티벌/행사': { bg: 'bg-violet-100', text: 'text-violet-700', gradient: 'from-violet-400 to-purple-300' },
  '서포터즈': { bg: 'bg-blue-100', text: 'text-blue-700', gradient: 'from-blue-400 to-cyan-300' },
  '리뷰/체험단': { bg: 'bg-teal-100', text: 'text-teal-700', gradient: 'from-teal-400 to-cyan-300' },
  '기타': { bg: 'bg-slate-100', text: 'text-slate-700', gradient: 'from-slate-400 to-gray-300' },
};

// ============================================
// Budget Ranges
// ============================================

export const BUDGET_RANGE_LABELS: Record<string, string> = {
  '<10': '10만 미만',
  '10-30': '10-30만',
  '30-50': '30-50만',
  '50-100': '50-100만',
  '100+': '100만+',
};

export type BudgetRangeDisplay = '10만 미만' | '10-30만' | '30-50만' | '50-100만' | '100만+';

export const BUDGET_RANGES: BudgetRangeDisplay[] = [
  '10만 미만',
  '10-30만',
  '30-50만',
  '50-100만',
  '100만+',
];

// ============================================
// Channels
// ============================================

export type ChannelType = 'Instagram' | 'YouTube' | 'TikTok';

export const CHANNELS: ChannelType[] = ['Instagram', 'YouTube', 'TikTok'];

// ============================================
// Objectives
// ============================================

export type ObjectiveType = '인지도' | '방문유도' | '구매전환' | '팔로우·구독';

export const OBJECTIVES: ObjectiveType[] = ['인지도', '방문유도', '구매전환', '팔로우·구독'];

export const OBJECTIVE_COLORS: Record<ObjectiveType, string> = {
  '인지도': 'from-blue-500 to-cyan-400',
  '방문유도': 'from-purple-500 to-pink-400',
  '구매전환': 'from-green-500 to-emerald-400',
  '팔로우·구독': 'from-orange-500 to-amber-400',
};

