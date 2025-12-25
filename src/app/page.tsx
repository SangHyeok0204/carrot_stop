'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // 사용자가 로그인되어 있으면 역할 확인 후 리다이렉트
        try {
          const token = await user.getIdToken();
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          const data = await response.json();
          
          if (data.success) {
            const role = data.data.role;
            if (role === 'admin') {
              router.push('/admin/dashboard');
            } else {
              router.push('/campaigns');
            }
          } else {
            router.push('/campaigns');
          }
        } catch (error) {
          router.push('/campaigns');
        }
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center space-y-8">
        <h1 className="text-5xl font-bold tracking-tight">
          AI 관리형 광고 운영 시스템
        </h1>
        <p className="text-xl text-muted-foreground">
          자연어로 느낌만 설명하면, 플랫폼이 끝까지 책임지고 운영해드립니다.
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/login">로그인</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/signup">회원가입</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

