'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CAMPAIGN_STATUS_LABELS } from '@/lib/utils';

export default function AdminCampaignDetailPage() {
  const params = useParams();
  const campaignId = params.id as string;
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    loadCampaign();
  }, [campaignId]);

  const loadCampaign = async () => {
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) return;

      const token = await user.getIdToken();
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setCampaign(data.data);
        setNewStatus(data.data.status);
      }
    } catch (error) {
      console.error('Load campaign error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async () => {
    // API 구현 필요 (현재는 예시)
    alert('상태 변경 기능은 API 구현 필요');
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
            현재 상태: <Badge>{CAMPAIGN_STATUS_LABELS[campaign.status] || campaign.status}</Badge>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">상태 변경</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="DRAFT">초안</option>
                <option value="GENERATED">생성됨</option>
                <option value="REVIEWED">검토 중</option>
                <option value="APPROVED">승인됨</option>
                <option value="OPEN">모집 중</option>
                <option value="RUNNING">집행 중</option>
                <option value="COMPLETED">완료</option>
                <option value="CANCELLED">취소됨</option>
              </select>
              <Button onClick={handleStatusChange} className="mt-2" disabled={newStatus === campaign.status}>
                상태 변경
              </Button>
            </div>

            {campaign.applications && (
              <div>
                <h3 className="font-semibold mb-2">지원자: {campaign.applications.length}명</h3>
              </div>
            )}

            {campaign.submissions && (
              <div>
                <h3 className="font-semibold mb-2">제출물: {campaign.submissions.length}개</h3>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

