'use client';

import { useRouter } from 'next/navigation';
import { Campaign } from '@/contexts';
import { OBJECTIVE_COLORS } from '@/lib/utils/constants';

interface CampaignCardProps {
  campaign: Campaign;
  style?: React.CSSProperties;
  className?: string;
}

// 채널 아이콘 (RadialHero 특성상 이모지 유지)
const channelIcons: Record<string, string> = {
  'Instagram': '📸',
  'YouTube': '🎬',
  'TikTok': '🎵',
};

// 목적 아이콘
const objectiveIcons: Record<string, string> = {
  '인지도': '👁️',
  '방문유도': '🔗',
  '구매전환': '💳',
  '팔로우·구독': '❤️',
};

export function CampaignCard({ campaign, style, className = '' }: CampaignCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/campaigns/${campaign.id}`);
  };

  const gradient = OBJECTIVE_COLORS[campaign.objective] || 'from-gray-500 to-gray-400';

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
        {/* 목적 */}
        <div className="flex items-center gap-1.5">
          <span className={`
            px-2 py-0.5 rounded-full text-xs font-semibold
            bg-gradient-to-r ${gradient} text-white
          `}>
            {campaign.objective}
          </span>
        </div>

        {/* 예산 */}
        <div className="flex items-center gap-1.5 text-sm">
          <span className="text-purple-400">💰</span>
          <span className="font-medium text-gray-700">{campaign.budgetRange}</span>
        </div>

        {/* 채널 */}
        <div className="flex items-center gap-1.5 text-sm">
          <span>{channelIcons[campaign.channel]}</span>
          <span className="text-gray-600">{campaign.channel}</span>
        </div>

        {/* 마감일 */}
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
