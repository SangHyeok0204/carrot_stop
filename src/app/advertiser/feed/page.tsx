'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Campaign {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  applicationsCount?: number;
}

const statusLabels: Record<string, string> = {
  DRAFT: '초안',
  GENERATING: '생성 중',
  GENERATED: '검토 대기',
  OPEN: '모집 중',
  IN_PROGRESS: '진행 중',
  COMPLETED: '완료',
  CANCELLED: '취소됨',
};

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  GENERATING: 'bg-yellow-100 text-yellow-800',
  GENERATED: 'bg-blue-100 text-blue-800',
  OPEN: 'bg-green-100 text-green-800',
  IN_PROGRESS: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-slate-100 text-slate-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export default function AdvertiserFeedPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const token = await user.getIdToken();
      const response = await fetch('/api/campaigns', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success) {
        setCampaigns(data.data.campaigns || []);
      }
    } catch (error) {
      console.error('Load campaigns error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">캠페인을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">내 캠페인</h1>
          <p className="text-muted-foreground">등록한 캠페인 {campaigns.length}개</p>
        </div>
        <Button asChild>
          <Link href="/advertiser/campaigns/new">새 캠페인 만들기</Link>
        </Button>
      </div>

      {campaigns.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <Card
              key={campaign.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/campaigns/${campaign.id}`)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg line-clamp-2">{campaign.title}</CardTitle>
                  <Badge className={statusColors[campaign.status] || 'bg-gray-100'}>
                    {statusLabels[campaign.status] || campaign.status}
                  </Badge>
                </div>
                <CardDescription>
                  {new Date(campaign.createdAt).toLocaleDateString('ko-KR')} 생성
                </CardDescription>
              </CardHeader>
              <CardContent>
                {campaign.applicationsCount !== undefined && (
                  <p className="text-sm text-muted-foreground">
                    지원자 {campaign.applicationsCount}명
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-4xl mb-4">📢</p>
            <p className="text-lg font-medium mb-2">아직 캠페인이 없습니다</p>
            <p className="text-muted-foreground mb-4">첫 번째 캠페인을 만들어보세요!</p>
            <Button asChild>
              <Link href="/advertiser/campaigns/new">캠페인 만들기</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
