'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { Plus, Users, Clock, DollarSign } from 'lucide-react';

interface Campaign {
  id: string;
  title: string;
  status: 'recruiting' | 'inProgress' | 'completed' | 'pending';
  budget: string;
  duration: string;
  channel: string;
  applicantsCount: number;
  selectedCount: number;
  createdAt: string;
}

export default function AdvertiserDashboardPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) return;

      const token = await user.getIdToken();

      const response = await fetch('/api/campaigns', {
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">내 캠페인</h1>
          <p className="text-muted-foreground mt-1">
            총 {campaigns.length}개의 캠페인
          </p>
        </div>
        <Button asChild className="bg-advertiser hover:bg-advertiser/90">
          <Link href="/advertiser/campaigns/new">
            <Plus className="mr-2 h-4 w-4" />
            새 캠페인 만들기
          </Link>
        </Button>
      </div>

      {/* Empty State */}
      {campaigns.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-advertiser/10 p-4 mb-4">
              <Plus className="h-8 w-8 text-advertiser" />
            </div>
            <h3 className="text-lg font-semibold mb-2">아직 캠페인이 없습니다</h3>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
              첫 캠페인을 만들어보세요. AI가 자동으로 기획서를 작성해드립니다.
            </p>
            <Button asChild className="bg-advertiser hover:bg-advertiser/90">
              <Link href="/advertiser/campaigns/new">
                <Plus className="mr-2 h-4 w-4" />
                캠페인 만들기
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Campaign Grid */}
      {campaigns.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <Link key={campaign.id} href={`/advertiser/campaigns/${campaign.id}`}>
              <Card className="h-full hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <StatusBadge status={campaign.status} />
                    <span className="text-xs text-muted-foreground">
                      {new Date(campaign.createdAt).toLocaleDateString('ko-KR', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <CardTitle className="line-clamp-2">{campaign.title}</CardTitle>
                  <CardDescription className="flex items-center gap-1 text-xs">
                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5">
                      {campaign.channel}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">예산:</span>
                    <span className="font-medium">{budgetLabels[campaign.budget] || campaign.budget}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">기간:</span>
                    <span className="font-medium">{durationLabels[campaign.duration] || campaign.duration}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">지원:</span>
                    <span className="font-medium">
                      {campaign.applicantsCount}명
                      {campaign.selectedCount > 0 && (
                        <span className="text-status-selected"> (선정 {campaign.selectedCount}명)</span>
                      )}
                    </span>
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
