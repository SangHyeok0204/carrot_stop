'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function CampaignsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

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
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    const auth = getFirebaseAuth();
    await signOut(auth);
    router.push('/login');
  };

  if (!user) {
    return <div>로딩 중...</div>;
  }

  const role = user.role;

  // Admin 레이아웃
  if (role === 'admin') {
    return (
      <div className="min-h-screen">
        <nav className="border-b bg-red-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/admin/dashboard" className="font-bold text-xl">
                관리자 대시보드
              </Link>
              <div className="flex gap-4">
                <Link
                  href="/admin/dashboard"
                  className={pathname === '/admin/dashboard' ? 'font-semibold' : ''}
                >
                  대시보드
                </Link>
                <Link
                  href="/campaigns"
                  className={pathname === '/campaigns' ? 'font-semibold' : ''}
                >
                  캠페인 관리
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{user.displayName || user.email}</span>
              <Button variant="outline" onClick={handleLogout} size="sm">
                로그아웃
              </Button>
            </div>
          </div>
        </nav>
        <main>{children}</main>
      </div>
    );
  }

  // Advertiser 레이아웃
  if (role === 'advertiser') {
    return (
      <div className="min-h-screen">
        <nav className="border-b">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/campaigns" className="font-bold text-xl">
                AI 광고 플랫폼
              </Link>
              <div className="flex gap-4">
                <Link
                  href="/campaigns"
                  className={`${pathname === '/campaigns' ? 'font-semibold' : ''}`}
                >
                  캠페인
                </Link>
                <Link
                  href="/campaigns/new"
                  className={`${pathname === '/campaigns/new' ? 'font-semibold' : ''}`}
                >
                  새 캠페인
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{user.displayName || user.email}</span>
              <Button variant="outline" onClick={handleLogout} size="sm">
                로그아웃
              </Button>
            </div>
          </div>
        </nav>
        <main>{children}</main>
      </div>
    );
  }

  // Influencer 레이아웃
  if (role === 'influencer') {
    return (
      <div className="min-h-screen">
        <nav className="border-b">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/campaigns" className="font-bold text-xl">
                AI 광고 플랫폼
              </Link>
              <Link
                href="/campaigns"
                className={pathname === '/campaigns' ? 'font-semibold' : ''}
              >
                캠페인 탐색
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{user.displayName || user.email}</span>
              <Button variant="outline" onClick={handleLogout} size="sm">
                로그아웃
              </Button>
            </div>
          </div>
        </nav>
        <main>{children}</main>
      </div>
    );
  }

  return <main>{children}</main>;
}

