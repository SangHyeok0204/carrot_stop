'use client';

import { useRouter } from 'next/navigation';
import { Campaign, CampaignStatus, CampaignCategory } from '@/contexts';

// ============================================
// Design Tokens (이모지 대신 컬러 사용)
// ============================================

// 카테고리별 색상
const categoryColors: Record<CampaignCategory, { bg: string; text: string; gradient: string }> = {
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

const statusConfig: Record<CampaignStatus, { label: string; className: string }> = {
  'OPEN': { label: '모집중', className: 'bg-green-500 text-white' },
  'IN_PROGRESS': { label: '진행중', className: 'bg-purple-500 text-white' },
  'COMPLETED': { label: '완료', className: 'bg-slate-400 text-white' },
  'CANCELLED': { label: '취소됨', className: 'bg-red-400 text-white' },
};

// ============================================
// Component
// ============================================

interface CampaignCardProps {
  campaign: Campaign;
  variant?: 'default' | 'compact';
  showStatus?: boolean;
  showAdvertiser?: boolean;
  onClick?: () => void;
  className?: string;
}

export function CampaignCard({
  campaign,
  variant = 'default',
  showStatus = true,
  showAdvertiser = false,
  onClick,
  className = '',
}: CampaignCardProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push(`/campaigns/${campaign.id}`);
    }
  };

  const categoryColor = categoryColors[campaign.category] || categoryColors['기타'];
  const status = statusConfig[campaign.status];

  // Compact variant (for lists)
  if (variant === 'compact') {
    return (
      <div
        onClick={handleClick}
        className={`
          bg-white rounded-xl border border-gray-100
          p-4 cursor-pointer
          hover:shadow-md hover:border-purple-200
          transition-all duration-200
          flex items-center gap-4
          ${className}
        `}
      >
        {/* 카테고리 컬러 도트 */}
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${categoryColor.gradient} flex items-center justify-center`}>
          <div className="w-5 h-5 bg-white/40 rounded-lg" />
        </div>

        {/* 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 truncate">{campaign.title}</h3>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${categoryColor.bg}`} />
              {campaign.category}
            </span>
            <span>{campaign.budgetRange}</span>
          </div>
        </div>

        {/* 상태 */}
        {showStatus && (
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.className}`}>
            {status.label}
          </span>
        )}
      </div>
    );
  }

  // Default variant (grid cards) - 이미지 배경 포함
  return (
    <div
      onClick={handleClick}
      className={`
        bg-white rounded-2xl border border-gray-100
        overflow-hidden cursor-pointer
        hover:shadow-xl hover:border-purple-200 hover:-translate-y-1
        transition-all duration-300
        group
        flex flex-col
        ${className}
      `}
    >
      {/* 상단 이미지/그라데이션 영역 - 전체의 70% */}
      <div className="flex-[0_0_70%] min-h-[200px] relative overflow-hidden">
        {campaign.imageUrl ? (
          // 실제 이미지가 있는 경우
          <>
            <img
              src={campaign.imageUrl}
              alt={campaign.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {/* 이미지 오버레이 */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </>
        ) : (
          // 이미지가 없는 경우 카테고리 기반 그라데이션
          <div className={`w-full h-full bg-gradient-to-br ${categoryColor.gradient}`}>
            {/* 장식용 도형 */}
            <div className="absolute inset-0 flex items-center justify-center opacity-30">
              <div className="w-20 h-20 bg-white/30 rounded-full" />
              <div className="absolute w-12 h-12 bg-white/20 rounded-lg rotate-45" />
            </div>
          </div>
        )}

        {/* 상태 배지 (좌상단) */}
        {showStatus && (
          <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-medium ${status.className}`}>
            {status.label}
          </span>
        )}

        {/* 카테고리 배지 (우상단) */}
        <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-medium ${categoryColor.bg} ${categoryColor.text}`}>
          {campaign.category}
        </span>
      </div>

      {/* 콘텐츠 - 나머지 30% */}
      <div className="flex-1 p-4 space-y-3 flex flex-col justify-between">
        {/* 제목 */}
        <h3 className="font-bold text-gray-900 line-clamp-2 group-hover:text-purple-600 transition-colors min-h-[2.5rem]">
          {campaign.title}
        </h3>

        {/* 광고주 */}
        {showAdvertiser && (
          <p className="text-sm text-gray-500 flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-gray-400" />
            </span>
            {campaign.advertiserName}
          </p>
        )}

        {/* 메타 정보 */}
        <div className="space-y-2 pt-2 border-t border-gray-50">
          {/* 예산 */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="w-4 h-4 rounded bg-purple-100 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-sm bg-purple-500" />
            </span>
            {campaign.budgetRange}
          </div>

          {/* 마감일 & 지원자 수 */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded bg-gray-100 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
              </span>
              {new Date(campaign.deadline).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} 마감
            </span>
            {campaign.applicationsCount > 0 && (
              <span className="text-purple-600 font-medium">
                {campaign.applicationsCount}명 지원
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Status Badge (Standalone)
// ============================================

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  const config = statusConfig[status];
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
