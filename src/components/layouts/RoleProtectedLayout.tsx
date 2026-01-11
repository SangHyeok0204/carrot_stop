'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { TopNav } from '@/components/shared/TopNav';
import { UserRole } from '@/types/user';

// ============================================
// Types
// ============================================

interface UserData {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  profile?: {
    companyName?: string;
    nickname?: string;
    photoURL?: string;
  };
}

interface RoleProtectedLayoutProps {
  children: React.ReactNode;
  requiredRole: UserRole;
}

// ============================================
// Loading Component
// ============================================

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-muted-foreground">로딩 중...</p>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function RoleProtectedLayout({
  children,
  requiredRole,
}: RoleProtectedLayoutProps) {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

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

        if (data.success && data.data.role === requiredRole) {
          setUser({
            uid: data.data.uid || firebaseUser.uid,
            email: data.data.email || firebaseUser.email || '',
            displayName: data.data.displayName,
            role: data.data.role,
            profile: data.data.profile,
          });
        } else {
          router.push('/auth/login');
        }
      } catch (error) {
        console.error('Auth verification error:', error);
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router, requiredRole]);

  if (loading || !user) {
    return <LoadingState />;
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main>{children}</main>
    </div>
  );
}
