'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';

export default function ReviewCampaignPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);

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

  const handleApprove = async () => {
    setApproving(true);
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) return;

      const token = await user.getIdToken();
      const response = await fetch(`/api/campaigns/${campaignId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'approve' }),
      });

      const data = await response.json();
      if (data.success) {
        router.push(`/advertiser/campaigns/${campaignId}`);
      }
    } catch (error) {
      console.error('Approve error:', error);
    } finally {
      setApproving(false);
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{campaign.title}</CardTitle>
              <Badge className="mt-2">{campaign.status}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {campaign.proposalMarkdown && (
            <div className="prose max-w-none">
              <ReactMarkdown>{campaign.proposalMarkdown}</ReactMarkdown>
            </div>
          )}

          {campaign.spec?.risk_flags && campaign.spec.risk_flags.length > 0 && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <h3 className="font-semibold mb-2">주의 사항</h3>
              <ul className="list-disc list-inside space-y-1">
                {campaign.spec.risk_flags.map((flag: any, idx: number) => (
                  <li key={idx}>
                    <strong>{flag.level}:</strong> {flag.description}
                    {flag.mitigation && (
                      <span className="text-sm text-muted-foreground">
                        {' '}(완화 방안: {flag.mitigation})
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 flex gap-4">
            <Button onClick={handleApprove} disabled={approving}>
              {approving ? '승인 중...' : '승인하고 모집 시작'}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/advertiser/campaigns/${campaignId}`)}
            >
              나중에
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

