'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { onAuthStateChanged, signOut } from 'firebase/auth';

// ============================================
// Types
// ============================================

type UserRole = 'advertiser' | 'influencer' | 'admin';

interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole | null;
}

const roleConfig: Record<UserRole, { label: string; className: string }> = {
  advertiser: {
    label: '광고주',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  influencer: {
    label: '인플루언서',
    className: 'bg-purple-100 text-purple-700 border-purple-200',
  },
  admin: {
    label: '관리자',
    className: 'bg-slate-100 text-slate-700 border-slate-200',
  },
};

// ============================================
// Component
// ============================================

interface TopNavProps {
  transparent?: boolean;
  className?: string;
}

export function TopNav({ transparent = false, className = '' }: TopNavProps) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const firebaseAuth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          const response = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          const data = await response.json();

          if (data.success && data.data) {
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: data.data.displayName || firebaseUser.displayName,
              role: data.data.role as UserRole,
            });
          } else {
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              role: null,
            });
          }
        } catch (e) {
          console.error('Auth fetch error:', e);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getMyPagePath = () => {
    if (!user?.role) return '/main';
    switch (user.role) {
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
      setUser(null);
      router.push('/main');
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  const bgClass = transparent
    ? 'bg-white/80 backdrop-blur-md'
    : 'bg-white';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 ${bgClass} border-b border-purple-100 ${className}`}>
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        {/* 좌측: 로고 */}
        <Link
          href="/main"
          className="text-xl font-bold bg-gradient-to-r from-purple-600 to-violet-500 bg-clip-text text-transparent hover:from-purple-700 hover:to-violet-600 transition-all"
        >
          ads platform
        </Link>

        {/* 우측: 인증 영역 */}
        <div className="flex items-center gap-3">
          {isLoading ? (
            <div className="w-20 h-9 bg-purple-100 rounded-lg animate-pulse" />
          ) : user ? (
            <>
              {/* Role 뱃지 */}
              {user.role && (
                <span className={`hidden sm:inline-flex px-3 py-1 rounded-full text-xs font-medium border ${roleConfig[user.role].className}`}>
                  {roleConfig[user.role].label}
                </span>
              )}

              {/* 사용자 이름 */}
              <span className="hidden md:block text-sm text-gray-600">
                {user.displayName || user.email}
              </span>

              {/* 마이페이지 버튼 */}
              <Link
                href={getMyPagePath()}
                className="
                  px-4 py-2 rounded-lg
                  bg-purple-600 text-white text-sm font-medium
                  hover:bg-purple-700 active:scale-95
                  transition-all duration-200
                "
              >
                마이페이지
              </Link>

              {/* 로그아웃 버튼 */}
              <button
                onClick={handleLogout}
                className="
                  px-3 py-2 rounded-lg
                  text-purple-600 text-sm font-medium
                  hover:bg-purple-50
                  transition-colors duration-200
                "
              >
                로그아웃
              </button>
            </>
          ) : (
            <Link
              href="/auth/login"
              className="
                px-4 py-2 rounded-lg
                bg-purple-600 text-white text-sm font-medium
                hover:bg-purple-700 active:scale-95
                transition-all duration-200
              "
            >
              로그인
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

