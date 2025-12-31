'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Users, FileText, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface Campaign {
  id: string;
  title: string;
  status: 'recruiting' | 'inProgress' | 'completed' | 'pending';
  budget: string;
  duration: string;
  channel: string;
  naturalLanguageInput?: string;
  proposal?: any;
  applications?: Application[];
  createdAt: string;
}

interface Application {
  id: string;
  influencerId: string;
  influencer: {
    displayName: string;
    email: string;
  };
  message: string;
  contentType: string;
  estimatedDate: string;
  status: 'applied' | 'underReview' | 'selected' | 'rejected';
  createdAt: string;
}

export default function AdvertiserCampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);

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
        headers: { 'Authorization': `Bearer ${token}` },
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

  const handleSelectInfluencer = async (applicationId: string) => {
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
      });

      const data = await response.json();
      if (data.success) {
        alert('인플루언서가 선정되었습니다.');
        loadCampaign();
      }
    } catch (error) {
      console.error('Select influencer error:', error);
      alert('선정에 실패했습니다.');
    }
  };

  const handleRejectInfluencer = async (applicationId: string) => {
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
        body: JSON.stringify({ action: 'reject' }),
      });

      const data = await response.json();
      if (data.success) {
        alert('거절되었습니다.');
        loadCampaign();
      }
    } catch (error) {
      console.error('Reject influencer error:', error);
      alert('거절에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-muted-foreground">캠페인을 찾을 수 없습니다.</p>
      </div>
    );
  }

  const appliedApplications = campaign.applications?.filter(app => app.status === 'applied' || app.status === 'underReview') || [];
  const selectedApplications = campaign.applications?.filter(app => app.status === 'selected') || [];

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Back Button */}
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/advertiser/dashboard">
          <ArrowLeft className="mr-2 h-4 w-4" />
          대시보드로 돌아가기
        </Link>
      </Button>

      {/* Campaign Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <StatusBadge status={campaign.status} />
                <span className="text-sm text-muted-foreground">
                  {new Date(campaign.createdAt).toLocaleDateString('ko-KR')}
                </span>
              </div>
              <CardTitle className="text-2xl mb-2">{campaign.title}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs">
                  {campaign.channel}
                </span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {campaign.proposal && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-advertiser/10 p-2">
                  <FileText className="h-4 w-4 text-advertiser" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">목적</p>
                  <p className="font-medium">{campaign.proposal.objective}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-advertiser/10 p-2">
                  <Users className="h-4 w-4 text-advertiser" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">지원자</p>
                  <p className="font-medium">{campaign.applications?.length || 0}명</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-advertiser/10 p-2">
                  <CheckCircle className="h-4 w-4 text-advertiser" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">선정</p>
                  <p className="font-medium">{selectedApplications.length}명</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="applications">
            지원자 ({appliedApplications.length})
          </TabsTrigger>
          <TabsTrigger value="selected">
            선정된 인플루언서 ({selectedApplications.length})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {campaign.proposal && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>타깃 & 톤</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">타깃 페르소나</p>
                    <p className="text-sm">{campaign.proposal.target}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">톤 & 무드</p>
                    <p className="text-sm">{campaign.proposal.tone}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>실행 가이드</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">추천 콘텐츠 타입</p>
                    <p className="text-sm">{campaign.proposal.contentType}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">핵심 메시지</p>
                    <ul className="space-y-2">
                      {campaign.proposal.coreMessages?.map((msg: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <span className="text-advertiser mt-0.5">•</span>
                          <span>{msg}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Applications Tab */}
        <TabsContent value="applications" className="space-y-4">
          {appliedApplications.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">아직 지원자가 없습니다</p>
              </CardContent>
            </Card>
          ) : (
            appliedApplications.map((app) => (
              <Card key={app.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{app.influencer.displayName}</CardTitle>
                      <CardDescription>{app.influencer.email}</CardDescription>
                    </div>
                    <StatusBadge status={app.status} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {app.message && (
                    <div>
                      <p className="text-sm font-medium mb-1">지원 메시지</p>
                      <p className="text-sm text-muted-foreground">{app.message}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">콘텐츠 타입</p>
                      <p className="font-medium">{app.contentType}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">예상 일정</p>
                      <p className="font-medium">{app.estimatedDate}</p>
                    </div>
                  </div>
                  {app.status === 'applied' && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => handleSelectInfluencer(app.id)}
                        className="bg-advertiser hover:bg-advertiser/90"
                      >
                        선정하기
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleRejectInfluencer(app.id)}
                      >
                        거절
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Selected Tab */}
        <TabsContent value="selected" className="space-y-4">
          {selectedApplications.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">선정된 인플루언서가 없습니다</p>
              </CardContent>
            </Card>
          ) : (
            selectedApplications.map((app) => (
              <Card key={app.id} className="border-status-selected/20 bg-status-selected/5">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{app.influencer.displayName}</CardTitle>
                      <CardDescription>{app.influencer.email}</CardDescription>
                    </div>
                    <StatusBadge status="selected" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">콘텐츠 타입</p>
                      <p className="font-medium">{app.contentType}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">예상 일정</p>
                      <p className="font-medium">{app.estimatedDate}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
