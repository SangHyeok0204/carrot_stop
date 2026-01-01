export type Objective = '인지도' | '방문유도' | '구매전환' | '팔로우·구독';
export type BudgetRange = '10만 미만' | '10-30만' | '30-50만' | '50-100만' | '100만+';
export type Channel = 'Instagram' | 'YouTube' | 'TikTok';

export interface MainCampaign {
  id: string;
  title: string;
  objective: Objective;
  budgetRange: BudgetRange;
  channel: Channel;
  deadline: string;
  isHot?: boolean;
}

export const MAIN_CAMPAIGNS: MainCampaign[] = [
  {
    id: 'mc-001',
    title: '뷰티 브랜드 신제품 런칭',
    objective: '인지도',
    budgetRange: '30-50만',
    channel: 'Instagram',
    deadline: '2026-01-15',
    isHot: true,
  },
  {
    id: 'mc-002',
    title: '헬스 보조제 구매 전환',
    objective: '구매전환',
    budgetRange: '50-100만',
    channel: 'Instagram',
    deadline: '2026-01-20',
  },
  {
    id: 'mc-003',
    title: '패션몰 방문 유도 캠페인',
    objective: '방문유도',
    budgetRange: '10-30만',
    channel: 'Instagram',
    deadline: '2026-01-12',
    isHot: true,
  },
  {
    id: 'mc-004',
    title: '요가 스튜디오 팔로워 확보',
    objective: '팔로우·구독',
    budgetRange: '10만 미만',
    channel: 'Instagram',
    deadline: '2026-01-18',
  },
  {
    id: 'mc-005',
    title: '프리미엄 커피 인지도 캠페인',
    objective: '인지도',
    budgetRange: '100만+',
    channel: 'YouTube',
    deadline: '2026-02-01',
  },
  {
    id: 'mc-006',
    title: '온라인 쇼핑몰 구매 전환',
    objective: '구매전환',
    budgetRange: '30-50만',
    channel: 'Instagram',
    deadline: '2026-01-25',
  },
  {
    id: 'mc-007',
    title: '틱톡 바이럴 챌린지',
    objective: '인지도',
    budgetRange: '50-100만',
    channel: 'TikTok',
    deadline: '2026-01-30',
    isHot: true,
  },
  {
    id: 'mc-008',
    title: '맛집 탐방 릴스 캠페인',
    objective: '방문유도',
    budgetRange: '10-30만',
    channel: 'Instagram',
    deadline: '2026-01-14',
  },
  {
    id: 'mc-009',
    title: '피트니스 앱 구독자 모집',
    objective: '팔로우·구독',
    budgetRange: '30-50만',
    channel: 'Instagram',
    deadline: '2026-01-22',
  },
  {
    id: 'mc-010',
    title: '펫푸드 브랜드 체험단',
    objective: '구매전환',
    budgetRange: '10-30만',
    channel: 'Instagram',
    deadline: '2026-01-16',
  },
  {
    id: 'mc-011',
    title: '홈 인테리어 쇼룸 방문',
    objective: '방문유도',
    budgetRange: '50-100만',
    channel: 'Instagram',
    deadline: '2026-01-28',
  },
  {
    id: 'mc-012',
    title: '스킨케어 브랜드 인지도',
    objective: '인지도',
    budgetRange: '30-50만',
    channel: 'Instagram',
    deadline: '2026-01-19',
  },
];

// 통계 데이터
export const CAMPAIGN_STATS = {
  totalRecruiting: 12,
  deadlineThisWeek: 3,
  totalApplicants: 156,
};
