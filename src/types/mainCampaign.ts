/**
 * 메인페이지 RadialHero 캠페인 카드용 타입 정의
 */

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
  advertiserName?: string;
  description?: string;
  category?: string;
  imageUrl?: string;
  applicationsCount?: number;
}

export interface CampaignStats {
  totalRecruiting: number;
  deadlineThisWeek: number;
}
