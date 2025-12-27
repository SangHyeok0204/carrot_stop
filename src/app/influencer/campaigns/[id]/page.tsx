'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function InfluencerCampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    loadCampaign();
  }, [campaignId]);

  const loadCampaign = async () => {
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) {
        router.push('/auth/login');
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

  const handleApply = async () => {
    setApplying(true);
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) return;

      const token = await user.getIdToken();
      const response = await fetch(`/api/campaigns/${campaignId}/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ message: '' }),
      });

      const data = await response.json();
      if (data.success) {
        alert('지원이 완료되었습니다.');
        loadCampaign();
      } else {
        alert(data.error?.message || '지원에 실패했습니다.');
      }
    } catch (error) {
      console.error('Apply error:', error);
      alert('지원에 실패했습니다.');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return <div className="container mx-auto py-8">로딩 중...</div>;
  }

  if (!campaign) {
    return <div className="container mx-auto py-8">캠페인을 찾을 수 없습니다.</div>;
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{campaign.title}</CardTitle>
          <CardDescription>
            상태: <Badge>{campaign.status}</Badge>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {campaign.spec && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">목적</h3>
                <p className="text-muted-foreground">{campaign.spec.objective}</p>
              </div>

              {campaign.spec.target_audience && (
                <div>
                  <h3 className="font-semibold mb-2">타겟 오디언스</h3>
                  <p className="text-muted-foreground">
                    {campaign.spec.target_audience.demographics}
                  </p>
                </div>
              )}

              {campaign.spec.recommended_content_types && campaign.spec.recommended_content_types.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">추천 콘텐츠 유형</h3>
                  <ul className="list-disc list-inside text-muted-foreground">
                    {campaign.spec.recommended_content_types.map((type: any, idx: number) => (
                      <li key={idx}>
                        {type.platform} - {type.format}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {campaign.spec.budget_range && (
                <div>
                  <h3 className="font-semibold mb-2">예산 범위</h3>
                  <p className="text-muted-foreground">
                    {campaign.spec.budget_range.min.toLocaleString()} ~ {campaign.spec.budget_range.max.toLocaleString()} {campaign.spec.budget_range.currency}
                  </p>
                </div>
              )}

              <div className="pt-4">
                <Button onClick={handleApply} disabled={applying || campaign.status !== 'OPEN'}>
                  {applying ? '지원 중...' : '지원하기'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

