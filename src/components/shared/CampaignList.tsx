'use client';

import { Campaign } from '@/contexts';
import { CampaignCard } from './CampaignCard';

// ============================================
// Types
// ============================================

interface CampaignListProps {
  campaigns: Campaign[];
  variant?: 'grid' | 'list' | 'compact';
  showStatus?: boolean;
  emptyMessage?: string;
  emptyIcon?: string;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

// ============================================
// Component
// ============================================

export function CampaignList({
  campaigns,
  variant = 'grid',
  showStatus = true,
  emptyMessage = '캠페인이 없습니다',
  emptyIcon = '📭',
  columns = 3,
  className = '',
}: CampaignListProps) {
  // Empty state
  if (campaigns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="text-5xl mb-4">{emptyIcon}</span>
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  // List variant
  if (variant === 'list' || variant === 'compact') {
    return (
      <div className={`space-y-3 ${className}`}>
        {campaigns.map((campaign) => (
          <CampaignCard
            key={campaign.id}
            campaign={campaign}
            variant="compact"
            showStatus={showStatus}
          />
        ))}
      </div>
    );
  }

  // Grid variant
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-6 ${className}`}>
      {campaigns.map((campaign) => (
        <CampaignCard
          key={campaign.id}
          campaign={campaign}
          variant="default"
          showStatus={showStatus}
        />
      ))}
    </div>
  );
}

// ============================================
// Section Wrapper
// ============================================

interface CampaignSectionProps {
  title: string;
  subtitle?: string;
  campaigns: Campaign[];
  variant?: 'grid' | 'list';
  showStatus?: boolean;
  emptyMessage?: string;
  actionButton?: React.ReactNode;
  className?: string;
}

export function CampaignSection({
  title,
  subtitle,
  campaigns,
  variant = 'grid',
  showStatus = true,
  emptyMessage,
  actionButton,
  className = '',
}: CampaignSectionProps) {
  return (
    <section className={className}>
      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          {subtitle && (
            <p className="text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        {actionButton}
      </div>

      {/* List */}
      <CampaignList
        campaigns={campaigns}
        variant={variant}
        showStatus={showStatus}
        emptyMessage={emptyMessage}
      />
    </section>
  );
}
