'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CAMPAIGN_STATUS_LABELS } from '@/lib/utils';
import Link from 'next/link';

export default function AdminCampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<any[]>([]);
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

