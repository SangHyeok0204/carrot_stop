'use client';

import { ReactNode } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { CampaignProvider, useCampaigns } from './CampaignContext';

// Combined Provider for easy usage
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CampaignProvider>
        {children}
      </CampaignProvider>
    </AuthProvider>
  );
}

// Re-export hooks and types
export { useAuth };
export { AuthProvider } from './AuthContext';
export { useCampaigns };
export { CampaignProvider } from './CampaignContext';

// Re-export types
export type {
  Campaign,
  CampaignListItem,
  CampaignListStatus,
  CampaignListStatus as CampaignStatus, // 하위 호환성
  CampaignCategory,
  Objective,
  Channel,
  BudgetRange,
  CreateCampaignInput,
} from './CampaignContext';
