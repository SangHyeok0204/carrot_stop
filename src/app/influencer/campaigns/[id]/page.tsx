'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/StatusBadge';
import { ArrowLeft, Send, DollarSign, Clock, Target } from 'lucide-react';
import Link from 'next/link';

interface Campaign {
  id: string;
  title: string;
  status: 'recruiting' | 'inProgress' | 'completed' | 'pending';
  budget: string;
  duration: string;
  channel: string;
  proposal?: {
    title: string;
    objective: string;
    target: string;
    tone: string;
    contentType: string;
    coreMessages: string[];
    legalChecklist: string[];
  };
  hasApplied?: boolean;
  createdAt: string;
}

export default function InfluencerCampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applicationForm, setApplicationForm] = useState({
    message: '',
    contentType: 'Reels',
    estimatedDate: '',
  });

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

  const handleApply = async () => {
    if (!applicationForm.message.trim() || !applicationForm.estimatedDate) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

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
        body: JSON.stringify(applicationForm),
      });

      const data = await response.json();
      if (data.success) {
        alert('지원이 완료되었습니다!');
        router.push('/influencer/applications');
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

  const budgetLabels: Record<string, string> = {
    '<10': '10만원 미만',
    '10-30': '10-30만원',
    '30-50': '30-50만원',
    '50-100': '50-100만원',
    '100+': '100만원 이상',
  };

  const durationLabels: Record<string, string> = {
    '3days': '3일',
    '1week': '1주',
    '2weeks': '2주',
    '1month': '1개월',
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

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Back Button */}
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/influencer/feed">
          <ArrowLeft className="mr-2 h-4 w-4" />
          캠페인 탐색으로 돌아가기
        </Link>
      </Button>

      {/* Campaign Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between mb-3">
            <StatusBadge status={campaign.status} />
            <span className="text-sm text-muted-foreground">
              {new Date(campaign.createdAt).toLocaleDateString('ko-KR')}
            </span>
          </div>
          <CardTitle className="text-2xl mb-2">{campaign.title}</CardTitle>
          {campaign.proposal && (
            <CardDescription className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-influencer/10 px-2 py-0.5 text-xs text-influencer">
                {campaign.proposal.objective}
              </span>
              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs">
                {campaign.channel}
              </span>
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{budgetLabels[campaign.budget] || campaign.budget}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{durationLabels[campaign.duration] || campaign.duration}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaign Details */}
      {campaign.proposal && (
        <div className="space-y-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>타깃 & 톤</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Target className="h-4 w-4 text-influencer" />
                  <p className="text-sm font-medium text-muted-foreground">타깃 페르소나</p>
                </div>
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
                  {campaign.proposal.coreMessages?.map((msg, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-influencer mt-0.5">•</span>
                      <span>{msg}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-800">
                ⚠️ 법적/운영 체크리스트
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {campaign.proposal.legalChecklist?.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-yellow-900">
                    <span className="mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Application Form */}
      {campaign.status === 'recruiting' && !campaign.hasApplied && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-influencer" />
              캠페인 지원하기
            </CardTitle>
            <CardDescription>
              지원서를 작성하고 제출하세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Message */}
            <div>
              <label className="text-sm font-medium mb-2 block">지원 메시지</label>
              <Textarea
                placeholder="자기소개 및 지원 동기를 작성해주세요..."
                value={applicationForm.message}
                onChange={(e) => setApplicationForm({ ...applicationForm, message: e.target.value })}
                className="min-h-[120px]"
              />
            </div>

            {/* Content Type */}
            <div>
              <label className="text-sm font-medium mb-2 block">콘텐츠 타입</label>
              <div className="grid grid-cols-3 gap-3">
                {['Reels', 'Feed Post', 'Story'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setApplicationForm({ ...applicationForm, contentType: type })}
                    className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      applicationForm.contentType === type
                        ? 'border-influencer bg-influencer/10 text-influencer'
                        : 'border-border hover:border-influencer/50'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Estimated Date */}
            <div>
              <label className="text-sm font-medium mb-2 block">예상 완료 일정</label>
              <input
                type="date"
                value={applicationForm.estimatedDate}
                onChange={(e) => setApplicationForm({ ...applicationForm, estimatedDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-influencer"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <Button
              onClick={handleApply}
              disabled={applying}
              className="w-full bg-influencer hover:bg-influencer/90"
            >
              {applying ? '지원 중...' : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  지원하기
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Already Applied */}
      {campaign.hasApplied && (
        <Card className="border-influencer/20 bg-influencer/5">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-influencer/10 p-4 mb-4">
              <Send className="h-8 w-8 text-influencer" />
            </div>
            <h3 className="text-lg font-semibold mb-2">이미 지원하셨습니다</h3>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
              광고주의 검토를 기다리고 있습니다
            </p>
            <Button asChild variant="outline">
              <Link href="/influencer/applications">
                내 지원현황 보기
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
