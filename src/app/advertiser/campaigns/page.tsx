'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CAMPAIGN_STATUS_LABELS } from '@/lib/utils';

// ============================================
// Campaign Delete Button Component
// ============================================

function CampaignDeleteButton({
  campaignId,
  campaignTitle,
  status,
  onDelete,
}: {
  campaignId: string;
  campaignTitle: string;
  status: string;
  onDelete: () => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`정말 "${campaignTitle}" 캠페인을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) return;

      const token = await user.getIdToken();
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        alert('캠페인이 삭제되었습니다.');
        onDelete();
      } else {
        alert(data.error?.message || '캠페인 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Delete campaign error:', error);
      alert('캠페인 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  // 진행 중인 캠페인은 삭제 불가
  if (status === 'RUNNING' || status === 'IN_PROGRESS') {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-red-600 hover:text-red-700 hover:bg-red-50"
    >
      {isDeleting ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          삭제 중...
        </>
      ) : (
        <>
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          삭제
        </>
      )}
    </Button>
  );
}

export default function CampaignsPage() {
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">내 캠페인</h1>
        <Button asChild>
          <Link href="/advertiser/campaigns/new">새 캠페인 만들기</Link>
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">아직 생성된 캠페인이 없습니다.</p>
            <Button asChild>
              <Link href="/advertiser/campaigns/new">첫 캠페인 만들기</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((campaign) => (
            <Card key={campaign.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
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
                  <div className="flex items-center gap-3">
                    <Badge>{CAMPAIGN_STATUS_LABELS[campaign.status] || campaign.status}</Badge>
                    <CampaignDeleteButton
                      campaignId={campaign.id}
                      campaignTitle={campaign.title}
                      status={campaign.status}
                      onDelete={loadCampaigns}
                    />
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

