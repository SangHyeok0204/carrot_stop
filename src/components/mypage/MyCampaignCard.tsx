'use client';

import { useRouter } from 'next/navigation';
import { Campaign, CampaignCategory } from '@/contexts';
import { Badge } from '@/components/ui/badge';

// ============================================
// Status Config
// ============================================

const statusConfig: Record<string, { label: string; className: string }> = {
  'OPEN': { label: '모집중', className: 'bg-green-500 text-white border-green-500' },
  'IN_PROGRESS': { label: '진행중', className: 'bg-purple-500 text-white border-purple-500' },
  'RUNNING': { label: '진행중', className: 'bg-purple-500 text-white border-purple-500' },
  'COMPLETED': { label: '완료', className: 'bg-gray-400 text-white border-gray-400' },
  'CANCELLED': { label: '취소됨', className: 'bg-red-400 text-white border-red-400' },
};

// ============================================
// Category Colors
// ============================================

const categoryColors: Record<CampaignCategory, string> = {
  '카페': 'from-amber-400 to-orange-300',
  '음식점': 'from-orange-400 to-red-300',
  '바/주점': 'from-purple-400 to-violet-300',
  '뷰티/미용': 'from-pink-400 to-rose-300',
  '패션/의류': 'from-rose-400 to-pink-300',
  '스포츠/피트니스': 'from-green-400 to-emerald-300',
  '페스티벌/행사': 'from-violet-400 to-purple-300',
  '서포터즈': 'from-blue-400 to-cyan-300',
  '리뷰/체험단': 'from-teal-400 to-cyan-300',
  '기타': 'from-slate-400 to-gray-300',
};

// ============================================
// Component
// ============================================

interface MyCampaignCardProps {
  campaign: Campaign;
  className?: string;
}

export function MyCampaignCard({ campaign, className = '' }: MyCampaignCardProps) {
  const router = useRouter();
  const status = statusConfig[campaign.status] || statusConfig['OPEN'];
  const gradientColor = categoryColors[campaign.category] || categoryColors['기타'];

  const handleClick = () => {
    router.push(`/campaigns/${campaign.id}`);
  };

  // 마감일 포맷팅
  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline);
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  return (
    <div
      onClick={handleClick}
      className={`
        bg-white rounded-xl border border-gray-100
        overflow-hidden cursor-pointer
        hover:shadow-md hover:border-gray-200
        transition-all duration-200
        ${className}
      `}
    >
      {/* 썸네일 영역 */}
      <div className="h-28 relative overflow-hidden">
        {campaign.imageUrl ? (
          <img
            src={campaign.imageUrl}
            alt={campaign.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradientColor}`}>
            <div className="absolute inset-0 flex items-center justify-center opacity-30">
              <div className="w-12 h-12 bg-white/30 rounded-full" />
            </div>
          </div>
        )}

        {/* 상태 배지 */}
        <Badge className={`absolute top-2 left-2 text-xs ${status.className}`}>
          {status.label}
        </Badge>
      </div>

      {/* 콘텐츠 */}
      <div className="p-3 space-y-2">
        {/* 제목 */}
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">
          {campaign.title}
        </h3>

        {/* 메타 정보 */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{formatDeadline(campaign.deadline)} 마감</span>
          <span className="text-gray-400">{campaign.budgetRange}</span>
        </div>
      </div>
    </div>
  );
}
