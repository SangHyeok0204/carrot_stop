'use client';

import { useRouter } from 'next/navigation';
import { Campaign, CampaignStatus, Objective, Channel } from '@/contexts';

// ============================================
// Design Tokens
// ============================================

const objectiveGradients: Record<Objective, string> = {
  '인지도': 'from-blue-500 to-cyan-400',
  '방문유도': 'from-purple-500 to-pink-400',
  '구매전환': 'from-green-500 to-emerald-400',
  '팔로우·구독': 'from-orange-500 to-amber-400',
};

const objectiveIcons: Record<Objective, string> = {
  '인지도': '👁️',
  '방문유도': '🔗',
  '구매전환': '💳',
  '팔로우·구독': '❤️',
};

const channelIcons: Record<Channel, string> = {
  'Instagram': '📸',
  'YouTube': '🎬',
  'TikTok': '🎵',
};

const statusConfig: Record<CampaignStatus, { label: string; className: string }> = {
  'OPEN': { label: '모집중', className: 'bg-green-100 text-green-700 border-green-200' },
  'IN_PROGRESS': { label: '진행중', className: 'bg-purple-100 text-purple-700 border-purple-200' },
  'COMPLETED': { label: '완료', className: 'bg-slate-100 text-slate-600 border-slate-200' },
  'CANCELLED': { label: '취소됨', className: 'bg-red-100 text-red-600 border-red-200' },
};

// ============================================
// Component
// ============================================

interface CampaignCardProps {
  campaign: Campaign;
  variant?: 'default' | 'compact' | 'radial';
  showStatus?: boolean;
  showAdvertiser?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
  className?: string;
}

export function CampaignCard({
  campaign,
  variant = 'default',
  showStatus = true,
  showAdvertiser = false,
  onClick,
  style,
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

  const gradient = objectiveGradients[campaign.objective] || 'from-gray-500 to-gray-400';
  const status = statusConfig[campaign.status];

  // Radial variant (for hero carousel)
  if (variant === 'radial') {
    return (
      <div
        onClick={handleClick}
        style={style}
        className={`
          absolute cursor-pointer
          w-44 h-56 sm:w-48 sm:h-60
          bg-white rounded-2xl shadow-lg
          border border-purple-100
          transition-all duration-300 ease-out
          hover:scale-110 hover:shadow-2xl hover:z-50
          hover:border-purple-300
          group
          ${className}
        `}
      >
        {/* 상단 그래디언트 */}
        <div className={`h-16 rounded-t-2xl bg-gradient-to-r ${gradient} relative overflow-hidden`}>
          {campaign.isHot && (
            <span className="absolute top-2 right-2 bg-white/90 text-xs font-bold px-2 py-0.5 rounded-full text-red-500">
              🔥 HOT
            </span>
          )}
          <div className="absolute bottom-2 left-3 text-white/90 text-2xl">
            {objectiveIcons[campaign.objective]}
          </div>
        </div>

        {/* 콘텐츠 */}
        <div className="p-3 space-y-2">
          <div className="flex items-center gap-1.5">
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r ${gradient} text-white`}>
              {campaign.objective}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-purple-400">💰</span>
            <span className="font-medium text-gray-700">{campaign.budgetRange}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <span>{channelIcons[campaign.channel]}</span>
            <span className="text-gray-600">{campaign.channel}</span>
          </div>
          <div className="text-xs text-gray-400 pt-1">
            마감: {new Date(campaign.deadline).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
          </div>
        </div>

        {/* 호버 시 CTA */}
        <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-purple-600 text-white text-center text-sm py-1.5 rounded-lg font-medium">
            상세 보기 →
          </div>
        </div>
      </div>
    );
  }

  // Compact variant (for lists)
  if (variant === 'compact') {
    return (
      <div
        onClick={handleClick}
        className={`
          bg-white rounded-xl border border-purple-100
          p-4 cursor-pointer
          hover:shadow-md hover:border-purple-200
          transition-all duration-200
          flex items-center gap-4
          ${className}
        `}
      >
        {/* 아이콘 */}
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${gradient} flex items-center justify-center text-xl`}>
          {objectiveIcons[campaign.objective]}
        </div>

        {/* 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 truncate">{campaign.title}</h3>
            {campaign.isHot && <span className="text-xs">🔥</span>}
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span>{channelIcons[campaign.channel]} {campaign.channel}</span>
            <span>💰 {campaign.budgetRange}</span>
          </div>
        </div>

        {/* 상태 */}
        {showStatus && (
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${status.className}`}>
            {status.label}
          </span>
        )}
      </div>
    );
  }

  // Default variant (grid cards)
  return (
    <div
      onClick={handleClick}
      className={`
        bg-white rounded-2xl border border-purple-100
        overflow-hidden cursor-pointer
        hover:shadow-xl hover:border-purple-200 hover:-translate-y-1
        transition-all duration-300
        group
        ${className}
      `}
    >
      {/* 상단 그래디언트 헤더 */}
      <div className={`h-24 bg-gradient-to-r ${gradient} relative overflow-hidden`}>
        {/* HOT 배지 */}
        {campaign.isHot && (
          <span className="absolute top-3 right-3 bg-white/95 text-xs font-bold px-2.5 py-1 rounded-full text-red-500 shadow-sm">
            🔥 HOT
          </span>
        )}

        {/* 상태 배지 */}
        {showStatus && (
          <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-medium border ${status.className} bg-white/95`}>
            {status.label}
          </span>
        )}

        {/* 아이콘 */}
        <div className="absolute bottom-3 left-4 text-3xl text-white/90">
          {objectiveIcons[campaign.objective]}
        </div>

        {/* 채널 아이콘 */}
        <div className="absolute bottom-3 right-4 text-xl text-white/80">
          {channelIcons[campaign.channel]}
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="p-4 space-y-3">
        {/* 제목 */}
        <h3 className="font-bold text-gray-900 line-clamp-2 group-hover:text-purple-600 transition-colors">
          {campaign.title}
        </h3>

        {/* 광고주 */}
        {showAdvertiser && (
          <p className="text-sm text-gray-500">
            by {campaign.advertiserName}
          </p>
        )}

        {/* 메타 정보 */}
        <div className="space-y-2">
          {/* 목적 & 예산 */}
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${gradient} text-white`}>
              {campaign.objective}
            </span>
            <span className="text-sm text-gray-600">💰 {campaign.budgetRange}</span>
          </div>

          {/* 마감일 & 지원자 수 */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">
              마감 {new Date(campaign.deadline).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
            </span>
            {campaign.applicationsCount > 0 && (
              <span className="text-purple-600 font-medium">
                지원 {campaign.applicationsCount}명
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 호버 시 CTA */}
      <div className="px-4 pb-4">
        <div className="
          bg-purple-50 text-purple-600 text-center py-2.5 rounded-xl
          font-medium text-sm
          group-hover:bg-purple-600 group-hover:text-white
          transition-colors duration-200
        ">
          자세히 보기 →
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
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${config.className}`}>
      {config.label}
    </span>
  );
}
