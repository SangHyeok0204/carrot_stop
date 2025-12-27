'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function InfluencerLayout({
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
        router.push('/auth/login');
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
        if (data.success && data.data.role === 'influencer') {
          setUser(data.data);
        } else {
          router.push('/auth/login');
        }
      } catch (error) {
        router.push('/auth/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    const auth = getFirebaseAuth();
    await signOut(auth);
    router.push('/auth/login');
  };

  if (!user) {
    return <div>로딩 중...</div>;
  }

  return (
    <div className="min-h-screen">
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/influencer/campaigns" className="font-bold text-xl">
              AI 광고 플랫폼
            </Link>
            <Link
              href="/influencer/campaigns"
              className={pathname?.includes('/influencer/campaigns') ? 'font-semibold' : ''}
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

