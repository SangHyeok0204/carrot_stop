'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CAMPAIGN_STATUS_LABELS } from '@/lib/utils/constants';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({});

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
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        const allCampaigns = data.data.campaigns || [];
        setCampaigns(allCampaigns);

        // 통계 계산
        const statusCount: Record<string, number> = {};
        allCampaigns.forEach((c: any) => {
          statusCount[c.status] = (statusCount[c.status] || 0) + 1;
        });
        setStats({
          total: allCampaigns.length,
          byStatus: statusCount,
        });
      }
    } catch (error) {
      console.error('Load campaigns error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container mx-auto py-8">로딩 중...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">관리자 대시보드</h1>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">전체 캠페인</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.total || 0}</p>
          </CardContent>
        </Card>
        {stats.byStatus && Object.entries(stats.byStatus).map(([status, count]: [string, any]) => (
          <Card key={status}>
            <CardHeader>
              <CardTitle className="text-lg">{CAMPAIGN_STATUS_LABELS[status] || status}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{count}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 캠페인 리스트 */}
      <Card>
        <CardHeader>
          <CardTitle>전체 캠페인</CardTitle>
          <CardDescription>모든 캠페인 목록</CardDescription>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <p className="text-muted-foreground">캠페인이 없습니다.</p>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">{campaign.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      ID: {campaign.id} | 생성일: {new Date(campaign.createdAt).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <Badge>{CAMPAIGN_STATUS_LABELS[campaign.status] || campaign.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

