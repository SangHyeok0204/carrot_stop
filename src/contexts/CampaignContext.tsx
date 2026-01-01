'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';

// ============================================
// Types
// ============================================

export type CampaignStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type Objective = '인지도' | '방문유도' | '구매전환' | '팔로우·구독';
export type Channel = 'Instagram' | 'YouTube' | 'TikTok';
export type BudgetRange = '10만 미만' | '10-30만' | '30-50만' | '50-100만' | '100만+';

export interface Campaign {
  id: string;
  advertiserId: string;
  advertiserName: string;
  title: string;
  description: string;
  objective: Objective;
  channel: Channel;
  budgetRange: BudgetRange;
  status: CampaignStatus;
  deadline: string;
  createdAt: string;
  applicationsCount: number;
  isHot?: boolean;
}

export interface CreateCampaignInput {
  title: string;
  description: string;
  objective: Objective;
  channel: Channel;
  budgetRange: BudgetRange;
  deadline: string;
}

// ============================================
// Context
// ============================================

interface CampaignContextType {
  campaigns: Campaign[];
  isLoading: boolean;
  error: string | null;

  // Fetch Methods
  fetchCampaigns: () => Promise<void>;
  fetchOpenCampaigns: () => Promise<void>;
  fetchMyCampaigns: () => Promise<void>;

  // CRUD Operations
  addCampaign: (input: CreateCampaignInput) => Promise<Campaign | null>;

  // Query Methods (from local state)
  getCampaignById: (id: string) => Campaign | undefined;
  getCampaignsByAdvertiser: (advertiserId: string) => Campaign[];
  getOpenCampaigns: () => Campaign[];

  // Stats
  getStats: () => {
    totalRecruiting: number;
    deadlineThisWeek: number;
  };
}

const CampaignContext = createContext<CampaignContextType | undefined>(undefined);

// ============================================
// Helper: Budget string conversion
// ============================================

function budgetRangeToApiValue(budgetRange: BudgetRange): string {
  const map: Record<BudgetRange, string> = {
    '10만 미만': '<10',
    '10-30만': '10-30',
    '30-50만': '30-50',
    '50-100만': '50-100',
    '100만+': '100+',
  };
  return map[budgetRange] || '10-30';
}

function apiBudgetToBudgetRange(budget: string): BudgetRange {
  const map: Record<string, BudgetRange> = {
    '<10': '10만 미만',
    '10-30': '10-30만',
    '30-50': '30-50만',
    '50-100': '50-100만',
    '100+': '100만+',
  };
  return map[budget] || '10-30만';
}

function channelToApiValue(channel: Channel): string {
  return channel.toLowerCase();
}

function apiChannelToChannel(channel: string): Channel {
  const map: Record<string, Channel> = {
    'instagram': 'Instagram',
    'youtube': 'YouTube',
    'tiktok': 'TikTok',
  };
  return map[channel?.toLowerCase()] || 'Instagram';
}

// ============================================
// Provider
// ============================================

export function CampaignProvider({ children }: { children: ReactNode }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to get auth token
  const getAuthToken = async (): Promise<string | null> => {
    const auth = getFirebaseAuth();
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken();
  };

  // Transform API campaign to our Campaign type
  const transformCampaign = (apiCampaign: any): Campaign => {
    // Determine deadline
    let deadline = apiCampaign.deadlineDate || apiCampaign.deadline;
    if (deadline && typeof deadline === 'object' && deadline._seconds) {
      deadline = new Date(deadline._seconds * 1000).toISOString().split('T')[0];
    } else if (deadline && typeof deadline === 'string') {
      deadline = deadline.split('T')[0];
    } else {
      deadline = new Date().toISOString().split('T')[0];
    }

    // Determine if hot (deadline within 7 days)
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const daysUntilDeadline = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const isHot = daysUntilDeadline <= 7 && daysUntilDeadline >= 0;

    return {
      id: apiCampaign.id,
      advertiserId: apiCampaign.advertiserId || '',
      advertiserName: apiCampaign.advertiserName || '광고주',
      title: apiCampaign.title || '제목 없음',
      description: apiCampaign.naturalLanguageInput || apiCampaign.description || '',
      objective: apiCampaign.objective || '인지도',
      channel: apiChannelToChannel(apiCampaign.channel),
      budgetRange: apiBudgetToBudgetRange(apiCampaign.budget),
      status: apiCampaign.status || 'OPEN',
      deadline,
      createdAt: apiCampaign.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
      applicationsCount: apiCampaign.applicationsCount || 0,
      isHot,
    };
  };

  // Fetch all campaigns (for main page)
  const fetchCampaigns = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/campaigns/latest?limit=20');
      const data = await response.json();

      if (data.success && data.data?.campaigns) {
        const transformed = data.data.campaigns.map(transformCampaign);
        setCampaigns(transformed);
      }
    } catch (err: any) {
      console.error('Failed to fetch campaigns:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch open campaigns
  const fetchOpenCampaigns = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getAuthToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/campaigns/latest?limit=20', { headers });
      const data = await response.json();

      if (data.success && data.data?.campaigns) {
        const transformed = data.data.campaigns.map(transformCampaign);
        setCampaigns(transformed);
      }
    } catch (err: any) {
      console.error('Failed to fetch open campaigns:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch my campaigns (for advertiser)
  const fetchMyCampaigns = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getAuthToken();
      if (!token) {
        setError('로그인이 필요합니다.');
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/campaigns', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success && data.data?.campaigns) {
        const transformed = data.data.campaigns.map(transformCampaign);
        setCampaigns(transformed);
      }
    } catch (err: any) {
      console.error('Failed to fetch my campaigns:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Add new campaign
  const addCampaign = useCallback(async (input: CreateCampaignInput): Promise<Campaign | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getAuthToken();
      if (!token) {
        setError('로그인이 필요합니다.');
        setIsLoading(false);
        return null;
      }

      // Calculate duration days
      const now = new Date();
      const deadline = new Date(input.deadline);
      const durationDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Prepare request body
      const body = {
        naturalLanguageInput: input.description,
        proposal: {
          title: input.title,
          objective: input.objective,
          target: '',
          tone: '',
          contentType: '',
          coreMessages: [],
          legalChecklist: [],
          estimatedBudget: input.budgetRange,
        },
        budget: budgetRangeToApiValue(input.budgetRange),
        duration: durationDays <= 3 ? '3days' : durationDays <= 7 ? '1week' : durationDays <= 14 ? '2weeks' : '1month',
        channel: channelToApiValue(input.channel),
      };

      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || '캠페인 생성에 실패했습니다.');
      }

      // Fetch updated campaigns
      await fetchMyCampaigns();

      return data.data;
    } catch (err: any) {
      console.error('Failed to add campaign:', err);
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchMyCampaigns]);

  // Get campaign by ID
  const getCampaignById = useCallback((id: string) => {
    return campaigns.find(campaign => campaign.id === id);
  }, [campaigns]);

  // Get campaigns by advertiser
  const getCampaignsByAdvertiser = useCallback((advertiserId: string) => {
    return campaigns.filter(campaign => campaign.advertiserId === advertiserId);
  }, [campaigns]);

  // Get open campaigns
  const getOpenCampaigns = useCallback(() => {
    return campaigns.filter(campaign => campaign.status === 'OPEN');
  }, [campaigns]);

  // Get stats
  const getStats = useCallback(() => {
    const openCampaigns = campaigns.filter(c => c.status === 'OPEN');
    const now = new Date();
    const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const deadlineThisWeek = openCampaigns.filter(c => {
      const deadline = new Date(c.deadline);
      return deadline >= now && deadline <= oneWeekLater;
    }).length;

    return {
      totalRecruiting: openCampaigns.length,
      deadlineThisWeek,
    };
  }, [campaigns]);

  const value: CampaignContextType = {
    campaigns,
    isLoading,
    error,
    fetchCampaigns,
    fetchOpenCampaigns,
    fetchMyCampaigns,
    addCampaign,
    getCampaignById,
    getCampaignsByAdvertiser,
    getOpenCampaigns,
    getStats,
  };

  return (
    <CampaignContext.Provider value={value}>
      {children}
    </CampaignContext.Provider>
  );
}

// ============================================
// Hook
// ============================================

export function useCampaigns() {
  const context = useContext(CampaignContext);
  if (context === undefined) {
    throw new Error('useCampaigns must be used within a CampaignProvider');
  }
  return context;
}
