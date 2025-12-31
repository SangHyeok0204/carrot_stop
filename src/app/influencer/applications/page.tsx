'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/StatusBadge';
import { Clock, DollarSign, FileText } from 'lucide-react';

interface Application {
  id: string;
  campaignId: string;
  campaign: {
    title: string;
    budget: string;
    duration: string;
    channel: string;
  };
  status: 'applied' | 'underReview' | 'selected' | 'inProgress' | 'completed';
  message: string;
  contentType: string;
  estimatedDate: string;
  createdAt: string;
}

type Status = 'applied' | 'underReview' | 'selected' | 'inProgress' | 'completed';

export default function InfluencerApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) return;

      const token = await user.getIdToken();

      const response = await fetch('/api/influencers/applications', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setApplications(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setLoading(false);
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

  const statusColumns: Status[] = ['applied', 'underReview', 'selected', 'inProgress', 'completed'];

  const statusLabels: Record<Status, string> = {
    applied: '지원함',
    underReview: '검토중',
    selected: '선정',
    inProgress: '진행중',
    completed: '완료',
  };

  const getApplicationsByStatus = (status: Status) => {
    return applications.filter(app => app.status === status);
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

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">내 지원현황</h1>
        <p className="text-muted-foreground">
          총 {applications.length}개의 지원
        </p>
      </div>

      {/* Empty State */}
      {applications.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-influencer/10 p-4 mb-4">
              <FileText className="h-8 w-8 text-influencer" />
            </div>
            <h3 className="text-lg font-semibold mb-2">아직 지원한 캠페인이 없습니다</h3>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
              관심 있는 캠페인을 탐색하고 지원해보세요.
            </p>
            <Link
              href="/influencer/feed"
              className="inline-flex items-center justify-center rounded-md bg-influencer px-4 py-2 text-sm font-medium text-influencer-foreground hover:bg-influencer/90 transition-colors"
            >
              캠페인 탐색하기
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Kanban Board */}
      {applications.length > 0 && (
        <div className="overflow-x-auto pb-4">
          <div className="inline-flex gap-4 min-w-full">
            {statusColumns.map((status) => {
              const apps = getApplicationsByStatus(status);
              return (
                <div key={status} className="flex-shrink-0 w-80">
                  {/* Column Header */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-sm uppercase tracking-wide">
                        {statusLabels[status]}
                      </h3>
                      <span className="text-xs bg-muted px-2 py-1 rounded-full font-medium">
                        {apps.length}
                      </span>
                    </div>
                    <div className="h-1 rounded-full bg-gradient-to-r from-influencer/20 to-influencer/5" />
                  </div>

                  {/* Cards */}
                  <div className="space-y-3">
                    {apps.length === 0 ? (
                      <div className="border-2 border-dashed rounded-lg p-6 text-center">
                        <p className="text-sm text-muted-foreground">없음</p>
                      </div>
                    ) : (
                      apps.map((app) => (
                        <Link
                          key={app.id}
                          href={`/influencer/campaigns/${app.campaignId}`}
                        >
                          <Card className="hover:shadow-md transition-all duration-200 cursor-pointer">
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between mb-2">
                                <StatusBadge status={app.status} />
                                <span className="text-xs text-muted-foreground">
                                  {new Date(app.createdAt).toLocaleDateString('ko-KR', {
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </span>
                              </div>
                              <CardTitle className="text-base line-clamp-2">
                                {app.campaign.title}
                              </CardTitle>
                              <CardDescription className="flex items-center gap-1 text-xs">
                                <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5">
                                  {app.campaign.channel}
                                </span>
                                <span className="inline-flex items-center rounded-full bg-influencer/10 px-2 py-0.5 text-influencer">
                                  {app.contentType}
                                </span>
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2 text-xs">
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-3 w-3 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                  {budgetLabels[app.campaign.budget] || app.campaign.budget}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                  예상: {new Date(app.estimatedDate).toLocaleDateString('ko-KR')}
                                </span>
                              </div>
                              {app.message && (
                                <div className="pt-2 border-t">
                                  <p className="text-muted-foreground line-clamp-2">
                                    {app.message}
                                  </p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
