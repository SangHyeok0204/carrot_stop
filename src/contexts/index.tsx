'use client';

import { ReactNode } from 'react';
import { CampaignProvider, useCampaigns } from './CampaignContext';

// Combined Provider for easy usage
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <CampaignProvider>
      {children}
    </CampaignProvider>
  );
}

// Re-export hooks and types
export { useCampaigns };
export { CampaignProvider } from './CampaignContext';

// Re-export types
export type {
  Campaign,
  CampaignStatus,
  CampaignCategory,
  Objective,
  Channel,
  BudgetRange,
  CreateCampaignInput,
} from './CampaignContext';
