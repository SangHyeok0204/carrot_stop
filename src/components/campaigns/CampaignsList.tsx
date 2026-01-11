'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { CAMPAIGN_STATUS_LABELS } from '@/lib/utils';

export default function CampaignsList() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'admin' | 'advertiser' | 'influencer' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) {
        router.push('/login');
        return;
      }

      const token = await user.getIdToken();
      
      // 사용자 역할 확인
      const userResponse = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const userData = await userResponse.json();
      
      if (!userData.success) {
        router.push('/login');
        return;
      }

      const role = userData.data.role;
      setUserRole(role);

      // 역할에 따라 다른 API 호출
      let apiEndpoint = '/api/campaigns';
      if (role === 'influencer') {
        apiEndpoint = '/api/campaigns/open';
      }

      const response = await fetch(apiEndpoint, {
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

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'draft': 'bg-gray-500',
      'pending': 'bg-amber-500',
      'open': 'bg-green-500',
      'in_progress': 'bg-purple-500',
      'completed': 'bg-slate-500',
      'cancelled': 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const filteredCampaigns = campaigns.filter((campaign) =>
    campaign.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  // Admin: 모든 캠페인 관리
  if (userRole === 'admin') {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-2">캠페인 관리</h1>
            <p className="text-muted-foreground">모든 캠페인을 관리하고 모니터링하세요</p>
          </div>

          {/* Search */}
          <div className="mb-6">
            <input
              type="text"
              name="campaign-search"
              id="campaign-search"
              placeholder="캠페인 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full max-w-md px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Campaigns Grid */}
          {filteredCampaigns.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  {searchQuery ? '검색 결과가 없습니다.' : '캠페인이 없습니다.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCampaigns.map((campaign) => (
                <Card key={campaign.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300 group">
                  <div className="relative h-48 bg-gradient-to-br from-primary/20 to-primary/5">
                    {/* 이미지 자리 - 추후 추가 가능 */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-4xl font-bold text-primary/30">{campaign.title?.[0] || 'C'}</div>
                    </div>
                    <Badge className={`absolute top-4 right-4 ${getStatusColor(campaign.status)} text-white`}>
                      {CAMPAIGN_STATUS_LABELS[campaign.status] || campaign.status}
                    </Badge>
                  </div>
                  <CardHeader>
                    <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                      {campaign.title || '제목 없음'}
                    </CardTitle>
                    <CardDescription>
                      생성일: {new Date(campaign.createdAt).toLocaleDateString('ko-KR')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild className="w-full" variant="outline">
                      <Link href={`/admin/campaigns/${campaign.id}`}>상세 보기</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Advertiser: 내 캠페인
  if (userRole === 'advertiser') {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">내 캠페인</h1>
              <p className="text-muted-foreground">내가 만든 캠페인을 관리하세요</p>
            </div>
            <Button asChild size="lg">
              <Link href="/campaigns/new">+ 새 캠페인 만들기</Link>
            </Button>
          </div>

          {/* Search */}
          {campaigns.length > 0 && (
            <div className="mb-6">
              <input
                type="text"
                placeholder="캠페인 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full max-w-md px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}

          {/* Empty State */}
          {filteredCampaigns.length === 0 && campaigns.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <div className="mb-6">
                  <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">아직 생성된 캠페인이 없습니다</h3>
                  <p className="text-muted-foreground mb-6">첫 번째 캠페인을 만들어보세요</p>
                </div>
                <Button asChild size="lg">
                  <Link href="/campaigns/new">첫 캠페인 만들기</Link>
                </Button>
              </CardContent>
            </Card>
          ) : filteredCampaigns.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">검색 결과가 없습니다.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCampaigns.map((campaign) => (
                <Card key={campaign.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer">
                  <Link href={`/campaigns/${campaign.id}`}>
                    <div className="relative h-48 bg-gradient-to-br from-primary/20 to-primary/5">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-4xl font-bold text-primary/30">{campaign.title?.[0] || 'C'}</div>
                      </div>
                      <Badge className={`absolute top-4 right-4 ${getStatusColor(campaign.status)} text-white`}>
                        {CAMPAIGN_STATUS_LABELS[campaign.status] || campaign.status}
                      </Badge>
                    </div>
                    <CardHeader>
                      <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                        {campaign.title || '제목 없음'}
                      </CardTitle>
                      <CardDescription>
                        생성일: {new Date(campaign.createdAt).toLocaleDateString('ko-KR')}
                      </CardDescription>
                    </CardHeader>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Influencer: 오픈 캠페인
  if (userRole === 'influencer') {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-2">오픈 캠페인</h1>
            <p className="text-muted-foreground">지원 가능한 캠페인을 탐색하세요</p>
          </div>

          {/* Search */}
          {campaigns.length > 0 && (
            <div className="mb-6">
              <input
                type="text"
                placeholder="캠페인 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full max-w-md px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}

          {/* Empty State */}
          {filteredCampaigns.length === 0 && campaigns.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <div className="mb-6">
                  <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">현재 오픈된 캠페인이 없습니다</h3>
                  <p className="text-muted-foreground">새로운 캠페인이 오픈되면 여기에 표시됩니다</p>
                </div>
              </CardContent>
            </Card>
          ) : filteredCampaigns.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">검색 결과가 없습니다.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCampaigns.map((campaign) => (
                <Card key={campaign.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
                  <div className="relative h-48 bg-gradient-to-br from-primary/20 to-primary/5">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-4xl font-bold text-primary/30">{campaign.title?.[0] || 'C'}</div>
                    </div>
                    <Badge className={`absolute top-4 right-4 ${getStatusColor(campaign.status)} text-white`}>
                      {CAMPAIGN_STATUS_LABELS[campaign.status] || campaign.status}
                    </Badge>
                  </div>
                  <CardHeader>
                    <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                      {campaign.title || '제목 없음'}
                    </CardTitle>
                    <CardDescription>
                      <div className="space-y-1">
                        <div>오픈일: {new Date(campaign.openedAt).toLocaleDateString('ko-KR')}</div>
                        {campaign.deadlineDate && (
                          <div>마감일: {new Date(campaign.deadlineDate).toLocaleDateString('ko-KR')}</div>
                        )}
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild className="w-full">
                      <Link href={`/campaigns/${campaign.id}`}>상세 보기</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}

