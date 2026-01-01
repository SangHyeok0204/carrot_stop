'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CAMPAIGN_STATUS_LABELS, APPLICATION_STATUS_LABELS } from '@/lib/utils';

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;
  const [campaign, setCampaign] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    loadData();
  }, [campaignId]);

  const loadData = async () => {
    try {
      const auth = getFirebaseAuth();
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        router.push('/auth/login');
        return;
      }

      const token = await firebaseUser.getIdToken();
      
      // 사용자 정보 로드
      const userResponse = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const userData = await userResponse.json();
      if (userData.success) {
        setUser(userData.data);
      }

      // 캠페인 정보 로드
      const campaignResponse = await fetch(`/api/campaigns/${campaignId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const campaignData = await campaignResponse.json();
      if (campaignData.success) {
        setCampaign(campaignData.data);
      }
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    setApplying(true);
    try {
      const auth = getFirebaseAuth();
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) return;

      const token = await firebaseUser.getIdToken();
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
        loadData();
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

  const handleSelectInfluencer = async (applicationId: string, action: 'select' | 'reject') => {
    try {
      const auth = getFirebaseAuth();
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) return;

      const token = await firebaseUser.getIdToken();
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
        loadData();
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

  const isAdvertiser = user?.role === 'advertiser';
  const isInfluencer = user?.role === 'influencer';
  const isOwner = campaign.advertiserId === user?.id;

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
            {isOwner && campaign.status === 'GENERATED' && (
              <Button onClick={() => router.push(`/campaigns/${campaignId}/review`)}>
                검토하기
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* 캠페인 상세 정보 */}
          {campaign.spec && (
            <div className="space-y-4 mb-6">
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
            </div>
          )}

          {/* 인플루언서용: 지원 버튼 */}
          {isInfluencer && campaign.status === 'OPEN' && (
            <div className="pt-4 border-t">
              <Button onClick={handleApply} disabled={applying}>
                {applying ? '지원 중...' : '지원하기'}
              </Button>
            </div>
          )}

          {/* 광고주용: 지원자 목록 */}
          {isOwner && campaign.applications && campaign.applications.length > 0 && (
            <div className="space-y-4 pt-4 border-t">
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

          {/* 제출물 */}
          {campaign.submissions && campaign.submissions.length > 0 && (
            <div className="mt-6 space-y-4 pt-4 border-t">
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

