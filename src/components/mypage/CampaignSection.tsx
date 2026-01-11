'use client';

import { Campaign } from '@/contexts';
import { CampaignCard } from '@/components/shared/CampaignCard';

// ============================================
// Campaign Section Component
// 진행 중인 캠페인 / 완료된 캠페인 섹션
// ============================================

interface CampaignSectionProps {
  title: string;
  campaigns: Campaign[];
  emptyMessage: string;
}

export function CampaignSection({ title, campaigns, emptyMessage }: CampaignSectionProps) {
  return (
    <section>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>

      {campaigns.length === 0 ? (
        <div className="py-12 text-center bg-gray-50 rounded-lg border border-gray-100">
          <p className="text-sm text-gray-500">{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              showStatus={true}
            />
          ))}
        </div>
      )}
    </section>
  );
}
