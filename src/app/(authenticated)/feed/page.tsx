'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { CAMPAIGN_STATUS_LABELS } from '@/lib/utils';
import { Heart } from 'lucide-react';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { getFirebaseApp } from '@/lib/firebase/auth';

export default function FeedPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'advertiser' | 'influencer' | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [favoritedCampaigns, setFavoritedCampaigns] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const tokenRef = useRef<string | null>(null);
  const favoritesUnsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }

      const token = await user.getIdToken();
      tokenRef.current = token;
      
      // 사용자 역할 확인
      const userResponse = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const userData = await userResponse.json();
      
      if (userData.success) {
        setUserRole(userData.data.role);
        setUserId(userData.data.uid);
        await loadCampaigns(userData.data.role, token, true);
        // 찜한 캠페인 목록 실시간 동기화 (인플루언서만)
        if (userData.data.role === 'influencer') {
          const unsubscribeFavorites = setupFavoritesRealtime(userData.data.uid);
          if (unsubscribeFavorites) {
            favoritesUnsubscribeRef.current = unsubscribeFavorites;
          }
        }
      }
    });

    return () => {
      unsubscribe();
      if (favoritesUnsubscribeRef.current) {
        favoritesUnsubscribeRef.current();
      }
    };
  }, [router]);

  // 무한 스크롤 설정
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore || loadingMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && hasMore && tokenRef.current && userRole) {
          loadMoreCampaigns(userRole, tokenRef.current);
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current.observe(loadMoreRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loadingMore, userRole]);

  const loadCampaigns = async (role: string, token: string, reset: boolean = false) => {
    try {
      if (reset) {
        setLoading(true);
        setCampaigns([]);
        setNextCursor(null);
        setHasMore(true);
      }

      let apiEndpoint = '/api/campaigns';
      if (role === 'influencer') {
        apiEndpoint = '/api/campaigns/open';
      }

      const url = new URL(apiEndpoint, window.location.origin);
      url.searchParams.set('limit', '20');
      if (statusFilter !== 'all') {
        url.searchParams.set('status', statusFilter);
      }

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        if (reset) {
          setCampaigns(data.data.campaigns || []);
        } else {
          setCampaigns(prev => [...prev, ...(data.data.campaigns || [])]);
        }
        setNextCursor(data.data.nextCursor);
        setHasMore(!!data.data.nextCursor);
      }
    } catch (error) {
      console.error('Load campaigns error:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreCampaigns = async (role: string, token: string) => {
    if (!nextCursor || loadingMore) return;
    
    setLoadingMore(true);
    try {
      let apiEndpoint = '/api/campaigns';
      if (role === 'influencer') {
        apiEndpoint = '/api/campaigns/open';
      }

      const url = new URL(apiEndpoint, window.location.origin);
      url.searchParams.set('limit', '20');
      url.searchParams.set('cursor', nextCursor);
      if (statusFilter !== 'all') {
        url.searchParams.set('status', statusFilter);
      }

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setCampaigns(prev => [...prev, ...(data.data.campaigns || [])]);
        setNextCursor(data.data.nextCursor);
        setHasMore(!!data.data.nextCursor);
      }
    } catch (error) {
      console.error('Load more campaigns error:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const setupFavoritesRealtime = (userId: string) => {
    try {
      const db = getFirestore(getFirebaseApp());
      const campaignsDocRef = doc(db, 'users', userId, 'favorites', 'campaigns');

      // 실시간으로 찜하기 상태 업데이트
      const unsubscribe = onSnapshot(campaignsDocRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          const itemIds = data?.itemIds || [];
          setFavoritedCampaigns(new Set(itemIds));
        } else {
          setFavoritedCampaigns(new Set());
        }
      }, (error) => {
        console.error('Favorites realtime error:', error);
      });

      // cleanup 함수를 위해 ref에 저장
      return unsubscribe;
    } catch (error) {
      console.error('Setup favorites realtime error:', error);
    }
  };

  const toggleFavorite = async (campaignId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!tokenRef.current || userRole !== 'influencer') return;

    const isFavorited = favoritedCampaigns.has(campaignId);
    const action = isFavorited ? 'remove' : 'add';

    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenRef.current}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'campaigns',
          itemId: campaignId,
          action,
        }),
      });

      const data = await response.json();
      if (data.success) {
        // 실시간 업데이트가 자동으로 처리됨 (onSnapshot)
      }
    } catch (error) {
      console.error('Toggle favorite error:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'DRAFT': 'bg-gray-500',
      'GENERATED': 'bg-blue-500',
      'REVIEWED': 'bg-yellow-500',
      'OPEN': 'bg-green-500',
      'RUNNING': 'bg-purple-500',
      'COMPLETED': 'bg-gray-600',
      'CANCELLED': 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  // 필터 변경 시 캠페인 다시 로드
  useEffect(() => {
    if (userRole && tokenRef.current && !loading) {
      loadCampaigns(userRole, tokenRef.current, true);
    }
  }, [statusFilter]);

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch = campaign.title?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

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

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 필터 바 */}
        <div className="mb-6 space-y-4">
          {/* 검색바 (모바일) */}
          <div className="lg:hidden">
            <input
              type="text"
              placeholder="캠페인 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* 상태 필터 */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                statusFilter === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              전체
            </button>
            {userRole === 'influencer' ? (
              <>
                <button
                  onClick={() => setStatusFilter('OPEN')}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    statusFilter === 'OPEN'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  모집중
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setStatusFilter('GENERATED')}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    statusFilter === 'GENERATED'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  생성됨
                </button>
                <button
                  onClick={() => setStatusFilter('OPEN')}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    statusFilter === 'OPEN'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  모집중
                </button>
                <button
                  onClick={() => setStatusFilter('RUNNING')}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    statusFilter === 'RUNNING'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  진행중
                </button>
              </>
            )}
          </div>
        </div>

        {/* 피드 영역 */}
        {filteredCampaigns.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="mb-6">
                <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {searchQuery || statusFilter !== 'all' ? '검색 결과가 없습니다' : '캠페인이 없습니다'}
                </h3>
                <p className="text-muted-foreground">
                  {userRole === 'advertiser' && (
                    <Link href="/campaigns/new" className="text-primary hover:underline">
                      첫 캠페인을 만들어보세요
                    </Link>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCampaigns.map((campaign) => (
              <Card
                key={campaign.id}
                className="overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer relative"
              >
                {/* 찜하기 버튼 (인플루언서만) */}
                {userRole === 'influencer' && (
                  <button
                    onClick={(e) => toggleFavorite(campaign.id, e)}
                    className={`absolute top-3 left-3 z-10 p-2 rounded-full bg-background/80 backdrop-blur-sm transition-all ${
                      favoritedCampaigns.has(campaign.id)
                        ? 'text-red-500'
                        : 'text-muted-foreground hover:text-red-500'
                    }`}
                  >
                    <Heart
                      className={`w-5 h-5 ${
                        favoritedCampaigns.has(campaign.id) ? 'fill-current' : ''
                      }`}
                    />
                  </button>
                )}
                <Link href={`/campaigns/${campaign.id}`}>
                  {/* 이미지 영역 */}
                  <div className="relative h-48 bg-gradient-to-br from-primary/20 to-primary/5">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-4xl font-bold text-primary/30">
                        {campaign.title?.[0] || 'C'}
                      </div>
                    </div>
                    <Badge
                      className={`absolute top-3 right-3 ${getStatusColor(campaign.status)} text-white`}
                    >
                      {CAMPAIGN_STATUS_LABELS[campaign.status] || campaign.status}
                    </Badge>
                  </div>

                  {/* 카드 내용 */}
                  <CardHeader className="pb-3">
                    <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors text-lg">
                      {campaign.title || '제목 없음'}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-2">
                      <span className="text-xs">
                        {formatTimeAgo(new Date(campaign.createdAt))}
                      </span>
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-0 space-y-2">
                    {/* 예산 정보 */}
                    {campaign.spec?.budget_range && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-lg">💰</span>
                        <span className="font-semibold">
                          {campaign.spec.budget_range.min.toLocaleString()} ~ {campaign.spec.budget_range.max.toLocaleString()}원
                        </span>
                      </div>
                    )}

                    {/* 마감일 */}
                    {campaign.deadlineDate && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>📅</span>
                        <span>마감: {formatTimeAgo(new Date(campaign.deadlineDate))}</span>
                      </div>
                    )}

                    {/* 지원자 수 (인플루언서 뷰) */}
                    {userRole === 'influencer' && campaign.applicationCount !== undefined && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>👥</span>
                        <span>지원자: {campaign.applicationCount}명</span>
                      </div>
                    )}

                    {/* 플랫폼 정보 */}
                    {campaign.spec?.recommended_content_types && campaign.spec.recommended_content_types.length > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <span>📱</span>
                        <div className="flex gap-1 flex-wrap">
                          {campaign.spec.recommended_content_types.slice(0, 2).map((type: any, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {type.platform}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        )}

        {/* 무한 스크롤 트리거 */}
        {hasMore && (
          <div ref={loadMoreRef} className="h-10 flex items-center justify-center">
            {loadingMore && (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            )}
          </div>
        )}
        {!hasMore && campaigns.length > 0 && (
          <div className="text-center py-8 text-muted-foreground">
            더 이상 불러올 캠페인이 없습니다
          </div>
        )}
      </div>

      {/* 플로팅 버튼 (광고주만) */}
      {userRole === 'advertiser' && (
        <Link
          href="/campaigns/new"
          className="fixed bottom-20 md:bottom-8 right-8 z-50 bg-primary text-primary-foreground rounded-full p-4 shadow-lg hover:shadow-xl transition-shadow"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </Link>
      )}
    </div>
  );
}

