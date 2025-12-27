'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        router.push('/login');
        return;
      }

      try {
        const token = await firebaseUser.getIdToken();
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (data.success) {
          setUser(data.data);
        } else {
          router.push('/login');
        }
      } catch (error) {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    const auth = getFirebaseAuth();
    await signOut(auth);
    router.push('/');
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

  if (!user) {
    return null;
  }

  const role = user.role;
  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/');

  // 역할별 메뉴 구성
  const getMenuItems = () => {
    if (role === 'advertiser') {
      return [
        { href: '/feed', label: '홈' },
        { href: '/campaigns', label: '내 캠페인' },
        { href: '/campaigns/new', label: '새 캠페인' },
        { href: '/influencers', label: '인플루언서 탐색' },
        { href: '/feed/favorites', label: '찜한 인플루언서' },
      ];
    } else if (role === 'influencer') {
      return [
        { href: '/feed', label: '홈' },
        { href: '/campaigns', label: '오픈 캠페인' },
        { href: '/feed/favorites', label: '찜한 캠페인' },
      ];
    } else if (role === 'admin') {
      return [
        { href: '/feed', label: '홈' },
        { href: '/admin/dashboard', label: '대시보드' },
        { href: '/admin/campaigns', label: '캠페인 관리' },
      ];
    }
    return [];
  };

  const menuItems = getMenuItems();

  return (
    <div className="min-h-screen bg-background">
      {/* 상단 네비게이션 바 */}
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* 좌측: 로고 및 메뉴 */}
            <div className="flex items-center gap-8">
              <Link href="/feed" className="font-bold text-xl hover:text-primary transition-colors">
                AI 광고 플랫폼
              </Link>
              
              {/* 메뉴 아이템 */}
              <div className="hidden md:flex items-center gap-6">
                {menuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      isActive(item.href)
                        ? 'text-primary border-b-2 border-primary pb-1'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* 우측: 검색, 알림, 프로필 */}
            <div className="flex items-center gap-4">
              {/* 검색바 (선택적) */}
              <div className="hidden lg:block">
                <input
                  type="text"
                  placeholder="캠페인 검색..."
                  className="w-64 px-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* 프로필 메뉴 */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  {user.displayName || user.email}
                </span>
                <Button variant="outline" onClick={handleLogout} size="sm">
                  로그아웃
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* 메인 콘텐츠 */}
      <main>{children}</main>

      {/* 모바일 하단 네비게이션 (선택적) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
        <div className="grid grid-cols-3 h-16">
          {menuItems.slice(0, 3).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center text-xs transition-colors ${
                isActive(item.href)
                  ? 'text-primary'
                  : 'text-muted-foreground'
              }`}
            >
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

