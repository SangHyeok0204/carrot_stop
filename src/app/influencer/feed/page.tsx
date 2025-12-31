'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { Search, DollarSign, Clock, Target } from 'lucide-react';

interface Campaign {
  id: string;
  title: string;
  status: 'recruiting';
  budget: string;
  duration: string;
  channel: string;
  proposal?: {
    objective: string;
    target: string;
    contentType: string;
  };
  applicantsCount: number;
  createdAt: string;
}

export default function InfluencerFeedPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    budget: 'all',
    duration: 'all',
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) return;

      const token = await user.getIdToken();

      const response = await fetch('/api/campaigns/open', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCampaigns(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const budgetLabels: Record<string, string> = {
    '<10': '10만원 미만',
    '10-30': '10-30만원',
    '30-50': '30-50만원',
    '50-100': '50-100만원',
    '100+': '100만원 이상',
  };

  const durationLabels: Record<string, string> = {
    '3days': '3일',
    '1week': '1주',
    '2weeks': '2주',
    '1month': '1개월',
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    if (filter.budget !== 'all' && campaign.budget !== filter.budget) return false;
    if (filter.duration !== 'all' && campaign.duration !== filter.duration) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">캠페인 탐색</h1>
        <p className="text-muted-foreground">
          모집 중인 {filteredCampaigns.length}개의 캠페인
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5" />
            필터
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Budget Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">예산 범위</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter({ ...filter, budget: 'all' })}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  filter.budget === 'all'
                    ? 'bg-influencer text-influencer-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                전체
              </button>
              {Object.entries(budgetLabels).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setFilter({ ...filter, budget: value })}
                  className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                    filter.budget === value
                      ? 'bg-influencer text-influencer-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Duration Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">기간</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter({ ...filter, duration: 'all' })}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  filter.duration === 'all'
                    ? 'bg-influencer text-influencer-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                전체
              </button>
              {Object.entries(durationLabels).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setFilter({ ...filter, duration: value })}
                  className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                    filter.duration === value
                      ? 'bg-influencer text-influencer-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      {filteredCampaigns.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-influencer/10 p-4 mb-4">
              <Search className="h-8 w-8 text-influencer" />
            </div>
            <h3 className="text-lg font-semibold mb-2">모집 중인 캠페인이 없습니다</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              필터를 조정하거나 나중에 다시 확인해주세요.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Campaign Grid */}
      {filteredCampaigns.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map((campaign) => (
            <Link key={campaign.id} href={`/influencer/campaigns/${campaign.id}`}>
              <Card className="h-full hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer border-l-4 border-l-influencer">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <StatusBadge status="recruiting" />
                    <span className="text-xs text-muted-foreground">
                      {new Date(campaign.createdAt).toLocaleDateString('ko-KR', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <CardTitle className="line-clamp-2">{campaign.title}</CardTitle>
                  {campaign.proposal && (
                    <CardDescription className="flex items-center gap-1 text-xs">
                      <span className="inline-flex items-center rounded-full bg-influencer/10 px-2 py-0.5 text-influencer">
                        {campaign.proposal.objective}
                      </span>
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {campaign.proposal && (
                    <div className="flex items-start gap-2 text-sm">
                      <Target className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <p className="text-muted-foreground line-clamp-2">
                        {campaign.proposal.target}
                      </p>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{budgetLabels[campaign.budget] || campaign.budget}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{durationLabels[campaign.duration] || campaign.duration}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      지원자 {campaign.applicantsCount}명
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
