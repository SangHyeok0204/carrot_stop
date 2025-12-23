'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CAMPAIGN_STATUS_LABELS, APPLICATION_STATUS_LABELS } from '@/lib/utils/constants';

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCampaign();
  }, [campaignId]);

  const loadCampaign = async () => {
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) {
        router.push('/login');
        return;
      }

      const token = await user.getIdToken();
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setCampaign(data.data);
      }
    } catch (error) {
      console.error('Load campaign error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectInfluencer = async (applicationId: string, action: 'select' | 'reject') => {
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) return;

      const token = await user.getIdToken();
      const response = await fetch(`/api/campaigns/${campaignId}/applications/${applicationId}/select`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();
      if (data.success) {
        loadCampaign();
      }
    } catch (error) {
      console.error('Select influencer error:', error);
    }
  };

  if (loading) {
    return <div className="container mx-auto py-8">로딩 중...</div>;
  }

  if (!campaign) {
    return <div className="container mx-auto py-8">캠페인을 찾을 수 없습니다.</div>;
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{campaign.title}</CardTitle>
              <CardDescription>
                상태: <Badge>{CAMPAIGN_STATUS_LABELS[campaign.status] || campaign.status}</Badge>
              </CardDescription>
            </div>
            {campaign.status === 'GENERATED' && (
              <Button onClick={() => router.push(`/campaigns/${campaignId}/review`)}>
                검토하기
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {campaign.applications && campaign.applications.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">지원자 목록</h3>
              {campaign.applications.map((app: any) => (
                <Card key={app.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{app.influencer?.displayName || '이름 없음'}</p>
                        <p className="text-sm text-muted-foreground">{app.influencer?.email}</p>
                        {app.message && (
                          <p className="mt-2 text-sm">{app.message}</p>
                        )}
                        <Badge className="mt-2">
                          {APPLICATION_STATUS_LABELS[app.status] || app.status}
                        </Badge>
                      </div>
                      {app.status === 'APPLIED' && campaign.status === 'OPEN' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSelectInfluencer(app.id, 'select')}
                          >
                            선정
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSelectInfluencer(app.id, 'reject')}
                          >
                            거절
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {campaign.submissions && campaign.submissions.length > 0 && (
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-semibold">제출물</h3>
              {campaign.submissions.map((sub: any) => (
                <Card key={sub.id}>
                  <CardContent className="pt-6">
                    <div>
                      <a
                        href={sub.postUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {sub.postUrl}
                      </a>
                      <Badge className="ml-2">{sub.status}</Badge>
                      {sub.metrics && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          조회수: {sub.metrics.views || 0}, 좋아요: {sub.metrics.likes || 0}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

