'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CAMPAIGN_STATUS_LABELS } from '@/lib/utils';
import { Heart } from 'lucide-react';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { getFirebaseApp } from '@/lib/firebase/auth';

export default function FavoritesPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'admin' | 'advertiser' | 'influencer' | null>(null);
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set());
  const favoritesUnsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
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
      
      if (userData.success) {
        setUserRole(userData.data.role);
        loadFavorites(userData.data.role, token);
        // 실시간 업데이트 설정
        if (userData.data.role === 'influencer' || userData.data.role === 'advertiser') {
          setupFavoritesRealtime(userData.data.uid, userData.data.role);
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

  const loadFavorites = async (role: string, token: string) => {
    try {
      setLoading(true);
      let type = '';
      if (role === 'influencer') {
        type = 'campaigns';
      } else if (role === 'advertiser') {
        type = 'influencers';
      } else {
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/favorites?type=${type}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setItems(data.data.items || []);
        if (type === 'campaigns') {
          setFavoritedIds(new Set(data.data.items.map((item: any) => item.id)));
        } else {
          setFavoritedIds(new Set(data.data.items.map((item: any) => item.id)));
        }
      }
    } catch (error) {
      console.error('Load favorites error:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupFavoritesRealtime = (userId: string, role: string) => {
    try {
      const db = getFirestore(getFirebaseApp());
      const type = role === 'influencer' ? 'campaigns' : 'influencers';
      const favoritesDocRef = doc(db, 'users', userId, 'favorites', type);

      // 실시간으로 찜하기 상태 업데이트
      favoritesUnsubscribeRef.current = onSnapshot(favoritesDocRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          const itemIds = data?.itemIds || [];
          setFavoritedIds(new Set(itemIds));
          
          // 찜한 항목이 제거되면 목록에서도 제거
          setItems(prev => prev.filter(item => itemIds.includes(item.id)));
        } else {
          setFavoritedIds(new Set());
          setItems([]);
        }
      }, (error) => {
        console.error('Favorites realtime error:', error);
      });
    } catch (error) {
      console.error('Setup favorites realtime error:', error);
    }
  };

  const toggleFavorite = async (itemId: string, type: string, token: string) => {
    const isFavorited = favoritedIds.has(itemId);
    const action = isFavorited ? 'remove' : 'add';

    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          itemId,
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
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">
            {userRole === 'influencer' ? '찜한 캠페인' : '찜한 인플루언서'}
          </h1>
          <p className="text-muted-foreground">
            {userRole === 'influencer'
              ? '관심 있는 캠페인을 모아서 확인하세요'
              : '관심 있는 인플루언서를 모아서 확인하세요'}
          </p>
        </div>

        {items.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="mb-6">
                <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
                  <Heart className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">찜한 항목이 없습니다</h3>
                <p className="text-muted-foreground">
                  {userRole === 'influencer' ? (
                    <Link href="/feed" className="text-primary hover:underline">
                      피드에서 캠페인을 찜해보세요
                    </Link>
                  ) : (
                    <Link href="/feed" className="text-primary hover:underline">
                      피드에서 인플루언서를 찜해보세요
                    </Link>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => {
              if (userRole === 'influencer') {
                // 캠페인 카드
                return (
                  <Card
                    key={item.id}
                    className="overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer relative"
                  >
                    <button
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const auth = getFirebaseAuth();
                        const user = auth.currentUser;
                        if (user) {
                          const token = await user.getIdToken();
                          await toggleFavorite(item.id, 'campaigns', token);
                        }
                      }}
                      className="absolute top-3 left-3 z-10 p-2 rounded-full bg-background/80 backdrop-blur-sm text-red-500"
                    >
                      <Heart className="w-5 h-5 fill-current" />
                    </button>
                    <Link href={`/campaigns/${item.id}`}>
                      <div className="relative h-48 bg-gradient-to-br from-primary/20 to-primary/5">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-4xl font-bold text-primary/30">
                            {item.title?.[0] || 'C'}
                          </div>
                        </div>
                        <Badge
                          className={`absolute top-3 right-3 ${getStatusColor(item.status)} text-white`}
                        >
                          {CAMPAIGN_STATUS_LABELS[item.status] || item.status}
                        </Badge>
                      </div>
                      <CardHeader className="pb-3">
                        <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors text-lg">
                          {item.title || '제목 없음'}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-2">
                          <span className="text-xs">
                            {formatTimeAgo(new Date(item.createdAt))}
                          </span>
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {item.deadlineDate && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>📅</span>
                            <span>마감: {formatTimeAgo(new Date(item.deadlineDate))}</span>
                          </div>
                        )}
                      </CardContent>
                    </Link>
                  </Card>
                );
              } else {
                // 인플루언서 카드
                return (
                  <Card
                    key={item.id}
                    className="overflow-hidden hover:shadow-lg transition-all duration-300 group"
                  >
                    <div className="relative h-48 bg-gradient-to-br from-primary/20 to-primary/5">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-4xl font-bold text-primary/30">
                          {item.displayName?.[0] || item.email?.[0] || 'I'}
                        </div>
                      </div>
                      <button
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const auth = getFirebaseAuth();
                          const user = auth.currentUser;
                          if (user) {
                            const token = await user.getIdToken();
                            await toggleFavorite(item.id, 'influencers', token);
                          }
                        }}
                        className="absolute top-3 left-3 z-10 p-2 rounded-full bg-background/80 backdrop-blur-sm text-red-500"
                      >
                        <Heart className="w-5 h-5 fill-current" />
                      </button>
                    </div>
                    <CardHeader className="pb-3">
                      <CardTitle className="group-hover:text-primary transition-colors text-lg">
                        {item.displayName || item.email || '인플루언서'}
                      </CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">
                        {item.email}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-2">
                      {item.profile?.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.profile.bio}
                        </p>
                      )}
                      {item.profile?.platforms && item.profile.platforms.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {item.profile.platforms.map((platform: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {platform}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {item.profile?.followerCount && (
                        <div className="text-sm text-muted-foreground">
                          팔로워: {item.profile.followerCount.toLocaleString()}명
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              }
            })}
          </div>
        )}
      </div>
    </div>
  );
}

