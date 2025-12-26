'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CAMPAIGN_STATUS_LABELS } from '@/lib/utils/constants';

export default function CampaignsList() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'admin' | 'advertiser' | 'influencer' | null>(null);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) {
        router.push('/login');
        return;
      }

      const token = await user.getIdToken();
      
      // 사용자 역할 확인
      const userResponse = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const userData = await userResponse.json();
      
      if (!userData.success) {
        router.push('/login');
        return;
      }

      const role = userData.data.role;
      setUserRole(role);

      // 역할에 따라 다른 API 호출
      let apiEndpoint = '/api/campaigns';
      if (role === 'influencer') {
        apiEndpoint = '/api/campaigns/open';
      }

      const response = await fetch(apiEndpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
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
    return <div className="container mx-auto py-8">로딩 중...</div>;
  }

  // Admin: 모든 캠페인 관리
  if (userRole === 'admin') {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">캠페인 관리</h1>

        <div className="grid gap-4">
          {campaigns.map((campaign) => (
            <Card key={campaign.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{campaign.title}</CardTitle>
                    <CardDescription>
                      ID: {campaign.id} | 생성일: {new Date(campaign.createdAt).toLocaleDateString('ko-KR')}
                    </CardDescription>
                  </div>
                  <Badge>{CAMPAIGN_STATUS_LABELS[campaign.status] || campaign.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline">
                  <Link href={`/admin/campaigns/${campaign.id}`}>상세 보기</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Advertiser: 내 캠페인
  if (userRole === 'advertiser') {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">내 캠페인</h1>
          <Button asChild>
            <Link href="/campaigns/new">새 캠페인 만들기</Link>
          </Button>
        </div>

        {campaigns.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">아직 생성된 캠페인이 없습니다.</p>
              <Button asChild>
                <Link href="/campaigns/new">첫 캠페인 만들기</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {campaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>
                        <Link
                          href={`/campaigns/${campaign.id}`}
                          className="hover:underline"
                        >
                          {campaign.title}
                        </Link>
                      </CardTitle>
                      <CardDescription>
                        생성일: {new Date(campaign.createdAt).toLocaleDateString('ko-KR')}
                      </CardDescription>
                    </div>
                    <Badge>{CAMPAIGN_STATUS_LABELS[campaign.status] || campaign.status}</Badge>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Influencer: 오픈 캠페인
  if (userRole === 'influencer') {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">오픈 캠페인</h1>

        {campaigns.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">현재 오픈된 캠페인이 없습니다.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {campaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardHeader>
                  <CardTitle>{campaign.title}</CardTitle>
                  <CardDescription>
                    오픈일: {new Date(campaign.openedAt).toLocaleDateString('ko-KR')}
                    {campaign.deadlineDate && (
                      <> | 마감일: {new Date(campaign.deadlineDate).toLocaleDateString('ko-KR')}</>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild>
                    <Link href={`/campaigns/${campaign.id}`}>상세 보기</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}

