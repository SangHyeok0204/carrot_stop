'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }

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
          if (role === 'advertiser') {
            router.push('/campaigns');
          } else if (role === 'influencer') {
            router.push('/campaigns');
          } else if (role === 'admin') {
            router.push('/admin/dashboard');
          } else {
            router.push('/login');
          }
        } else {
          router.push('/login');
        }
      } catch (error) {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  return <div>리다이렉트 중...</div>;
}

