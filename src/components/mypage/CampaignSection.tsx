'use client';

import { Campaign } from '@/contexts';
import { MyCampaignCard } from './MyCampaignCard';

// ============================================
// Campaign Section Component
// ============================================

interface CampaignSectionProps {
  title: string;
  campaigns: Campaign[];
  emptyMessage: string;
}

export function CampaignSection({ title, campaigns, emptyMessage }: CampaignSectionProps) {
  return (
    <section>
      <h3 className="text-base font-semibold text-gray-900 mb-4">{title}</h3>

      {campaigns.length === 0 ? (
        <div className="py-8 text-center text-gray-400 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-sm">{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {campaigns.map((campaign) => (
            <MyCampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}
    </section>
  );
}
