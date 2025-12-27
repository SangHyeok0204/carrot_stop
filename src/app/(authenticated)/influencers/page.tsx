'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { getFirestore, collection, query, where, orderBy, limit, onSnapshot, startAfter, getDocs, DocumentSnapshot, doc } from 'firebase/firestore';
import { getFirebaseApp } from '@/lib/firebase/auth';

export default function InfluencersPage() {
  const router = useRouter();
  const [influencers, setInfluencers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<DocumentSnapshot | null>(null);
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const favoritesUnsubscribeRef = useRef<(() => void) | null>(null);
  const tokenRef = useRef<string | null>(null);

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
        if (userData.data.role !== 'advertiser' && userData.data.role !== 'admin') {
          router.push('/feed');
          return;
        }
        loadInfluencers(user.uid);
        setupFavoritesRealtime(user.uid);
      }
    });

    return () => {
      unsubscribe();
      if (unsubscribeRef.current) unsubscribeRef.current();
      if (favoritesUnsubscribeRef.current) favoritesUnsubscribeRef.current();
    };
  }, [router]);

  const loadInfluencers = (userId: string) => {
    try {
      setLoading(true);
      const db = getFirestore(getFirebaseApp());
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'influencer'),
        orderBy('createdAt', 'desc'),
        limit(20)
      );

      // 실시간 업데이트 구독
      unsubscribeRef.current = onSnapshot(q, (snapshot) => {
        const influencersData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            email: data.email,
            displayName: data.displayName,
            profile: data.profile,
            createdAt: data.createdAt?.toDate().toISOString(),
            updatedAt: data.updatedAt?.toDate().toISOString(),
          };
        });

        setInfluencers(influencersData);
        if (snapshot.docs.length > 0) {
          setNextCursor(snapshot.docs[snapshot.docs.length - 1]);
          setHasMore(snapshot.docs.length === 20);
        } else {
          setHasMore(false);
        }
        setLoading(false);
      }, (error) => {
        console.error('Load influencers error:', error);
        setLoading(false);
      });
    } catch (error) {
      console.error('Load influencers error:', error);
      setLoading(false);
    }
  };

  const loadMoreInfluencers = async (userId: string) => {
    if (!nextCursor || loadingMore) return;
    
    try {
      setLoadingMore(true);
      const db = getFirestore(getFirebaseApp());
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'influencer'),
        orderBy('createdAt', 'desc'),
        startAfter(nextCursor),
        limit(20)
      );

      const snapshot = await getDocs(q);
      const newInfluencers = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          email: data.email,
          displayName: data.displayName,
          profile: data.profile,
          createdAt: data.createdAt?.toDate().toISOString(),
          updatedAt: data.updatedAt?.toDate().toISOString(),
        };
      });

      setInfluencers(prev => [...prev, ...newInfluencers]);
      if (snapshot.docs.length > 0) {
        setNextCursor(snapshot.docs[snapshot.docs.length - 1]);
        setHasMore(snapshot.docs.length === 20);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Load more influencers error:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const setupFavoritesRealtime = (userId: string) => {
    try {
      const db = getFirestore(getFirebaseApp());
      const influencersDocRef = doc(db, 'users', userId, 'favorites', 'influencers');

      // 실시간으로 찜하기 상태 업데이트
      favoritesUnsubscribeRef.current = onSnapshot(influencersDocRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          const itemIds = data?.itemIds || [];
          setFavoritedIds(new Set(itemIds));
        } else {
          setFavoritedIds(new Set());
        }
      }, (error) => {
        console.error('Favorites realtime error:', error);
      });
    } catch (error) {
      console.error('Setup favorites realtime error:', error);
    }
  };

  const toggleFavorite = async (influencerId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!tokenRef.current) return;

    const isFavorited = favoritedIds.has(influencerId);
    const action = isFavorited ? 'remove' : 'add';

    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenRef.current}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'influencers',
          itemId: influencerId,
          action,
        }),
      });

      const data = await response.json();
      if (data.success) {
        // 실시간 업데이트가 자동으로 처리됨
      }
    } catch (error) {
      console.error('Toggle favorite error:', error);
    }
  };

  const filteredInfluencers = influencers.filter((influencer) => {
    const matchesSearch = !searchQuery || 
      influencer.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      influencer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      influencer.profile?.bio?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPlatform = platformFilter === 'all' ||
      influencer.profile?.platforms?.includes(platformFilter);
    
    return matchesSearch && matchesPlatform;
  });

  // 무한 스크롤
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.offsetHeight - 1000) {
        if (hasMore && !loadingMore) {
          const auth = getFirebaseAuth();
          const user = auth.currentUser;
          if (user) {
            loadMoreInfluencers(user.uid);
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, loadingMore]);

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

  const platforms = ['instagram', 'youtube', 'tiktok', 'blog', 'facebook'];

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">인플루언서 탐색</h1>
          <p className="text-muted-foreground">
            협업할 인플루언서를 찾아보고 찜해보세요
          </p>
        </div>

        {/* 필터 바 */}
        <div className="mb-6 space-y-4">
          {/* 검색바 */}
          <div>
            <input
              type="text"
              placeholder="이름, 이메일, 소개로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* 플랫폼 필터 */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setPlatformFilter('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                platformFilter === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              전체
            </button>
            {platforms.map((platform) => (
              <button
                key={platform}
                onClick={() => setPlatformFilter(platform)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors capitalize ${
                  platformFilter === platform
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {platform}
              </button>
            ))}
          </div>
        </div>

        {/* 인플루언서 목록 */}
        {filteredInfluencers.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="mb-6">
                <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {searchQuery || platformFilter !== 'all' ? '검색 결과가 없습니다' : '인플루언서가 없습니다'}
                </h3>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredInfluencers.map((influencer) => (
              <Card
                key={influencer.id}
                className="overflow-hidden hover:shadow-lg transition-all duration-300 group relative"
              >
                {/* 찜하기 버튼 */}
                <button
                  onClick={(e) => toggleFavorite(influencer.id, e)}
                  className={`absolute top-3 left-3 z-10 p-2 rounded-full bg-background/80 backdrop-blur-sm transition-all ${
                    favoritedIds.has(influencer.id)
                      ? 'text-red-500'
                      : 'text-muted-foreground hover:text-red-500'
                  }`}
                >
                  <Heart
                    className={`w-5 h-5 ${
                      favoritedIds.has(influencer.id) ? 'fill-current' : ''
                    }`}
                  />
                </button>

                {/* 프로필 이미지 영역 */}
                <div className="relative h-48 bg-gradient-to-br from-primary/20 to-primary/5">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-4xl font-bold text-primary/30">
                      {influencer.displayName?.[0] || influencer.email?.[0] || 'I'}
                    </div>
                  </div>
                </div>

                {/* 카드 내용 */}
                <CardHeader className="pb-3">
                  <CardTitle className="group-hover:text-primary transition-colors text-lg">
                    {influencer.displayName || influencer.email || '인플루언서'}
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    {influencer.email}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0 space-y-2">
                  {influencer.profile?.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {influencer.profile.bio}
                    </p>
                  )}
                  
                  {influencer.profile?.platforms && influencer.profile.platforms.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {influencer.profile.platforms.map((platform: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs capitalize">
                          {platform}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  {influencer.profile?.followerCount && (
                    <div className="text-sm text-muted-foreground">
                      팔로워: {influencer.profile.followerCount.toLocaleString()}명
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* 무한 스크롤 로딩 */}
        {loadingMore && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        )}

        {!hasMore && influencers.length > 0 && (
          <div className="text-center py-8 text-muted-foreground">
            더 이상 불러올 인플루언서가 없습니다
          </div>
        )}
      </div>
    </div>
  );
}

