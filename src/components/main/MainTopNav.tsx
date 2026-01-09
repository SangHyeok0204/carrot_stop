'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { onAuthStateChanged, signOut } from 'firebase/auth';

type Role = 'advertiser' | 'influencer' | 'admin';

interface AuthState {
  isLoggedIn: boolean;
  role: Role | null;
  email: string | null;
}

const roleLabels: Record<Role, string> = {
  advertiser: '광고주',
  influencer: '인플루언서',
  admin: '관리자',
};

const roleColors: Record<Role, string> = {
  advertiser: 'bg-blue-100 text-blue-700',
  influencer: 'bg-purple-100 text-purple-700',
  admin: 'bg-slate-100 text-slate-700',
};

export function MainTopNav() {
  const router = useRouter();
  const [auth, setAuth] = useState<AuthState>({ isLoggedIn: false, role: null, email: null });
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);

    const firebaseAuth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (user) {
        try {
          // 사용자 역할 정보 가져오기
          const token = await user.getIdToken();
          const response = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          const data = await response.json();

          if (data.success && data.data) {
            setAuth({
              isLoggedIn: true,
              role: data.data.role as Role,
              email: user.email,
            });
          } else {
            setAuth({ isLoggedIn: true, role: null, email: user.email });
          }
        } catch (e) {
          console.error('Auth fetch error:', e);
          setAuth({ isLoggedIn: true, role: null, email: user.email });
        }
      } else {
        setAuth({ isLoggedIn: false, role: null, email: null });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getMyPagePath = () => {
    switch (auth.role) {
      case 'advertiser':
        return '/advertiser/dashboard';
      case 'influencer':
        return '/influencer/feed';
      case 'admin':
        return '/admin/dashboard';
      default:
        return '/main';
    }
  };

  const handleLogout = async () => {
    try {
      const firebaseAuth = getFirebaseAuth();
      await signOut(firebaseAuth);
      setAuth({ isLoggedIn: false, role: null, email: null });
      router.push('/main');
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  if (!mounted || loading) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-purple-100">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <Link href="/main" className="text-xl font-bold text-purple-600">
            I:EUM
          </Link>
          <div className="w-20 h-9 bg-purple-100 rounded-md animate-pulse" />
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-purple-100">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        {/* 로고 */}
        <Link
          href="/main"
          className="text-xl font-bold bg-gradient-to-r from-purple-600 to-violet-500 bg-clip-text text-transparent"
        >
          I:EUM
        </Link>

        {/* 우측 영역 */}
        <div className="flex items-center gap-3">
          {auth.isLoggedIn && auth.role ? (
            <>
              {/* Role 뱃지 */}
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${roleColors[auth.role]}`}>
                {roleLabels[auth.role]}
              </span>

              {/* 마이페이지 버튼 */}
              <Button
                asChild
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Link href={getMyPagePath()}>마이페이지</Link>
              </Button>

              {/* 로그아웃 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
              >
                로그아웃
              </Button>
            </>
          ) : (
            <Button
              asChild
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Link href="/auth/login">로그인</Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
