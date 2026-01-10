'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { LogoutModal } from '@/components/ui/logout-modal';

// ============================================
// Types
// ============================================

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
  onMenuClick?: () => void; // 로고 클릭 핸들러 (비로그인: 모달, 로그인: 사이드바 열기)
  isSidebarOpen?: boolean; // 사이드바 열림 상태
  isAuthenticated?: boolean; // 인증 상태 (외부에서 전달받을 경우, 미사용 시 AuthContext 사용)
}

export function TopNav({ transparent = false, className = '', onMenuClick, isSidebarOpen = false }: TopNavProps) {
  const router = useRouter();
  const { user, isLoading, isLoggedIn, logout, getMyPagePath } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // 로그아웃 버튼 클릭 시 모달 열기
  const handleLogoutClick = useCallback(() => {
    setShowLogoutModal(true);
  }, []);

  // 모달에서 확인 클릭 시 실제 로그아웃 실행
  const handleLogoutConfirm = useCallback(async () => {
    try {
      await logout();
      setShowLogoutModal(false);
      router.push('/main');
    } catch (e) {
      console.error('Logout error:', e);
    }
  }, [router, logout]);

  // 모달 닫기
  const handleLogoutCancel = useCallback(() => {
    setShowLogoutModal(false);
  }, []);

  const bgClass = transparent
    ? 'bg-white/80 backdrop-blur-md'
    : 'bg-white';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 ${bgClass} border-b border-purple-100 ${className}`}>
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        {/* 좌측: 로고 (사이드바 닫힌 상태에서 클릭 시 핸들러 호출) */}
        <div className="flex items-center gap-3">
          {/* 로고 - 사이드바가 닫혀있고 onMenuClick이 있으면 버튼으로 동작 */}
          {/* 비로그인 시 → 모달 열기, 로그인 시 → 사이드바 열기 (부모에서 분기 처리) */}
          {onMenuClick && !isSidebarOpen ? (
            <button
              onClick={onMenuClick}
              className="text-xl font-bold bg-gradient-to-r from-purple-600 to-violet-500 bg-clip-text text-transparent hover:from-purple-700 hover:to-violet-600 transition-all"
              aria-label={!isLoggedIn ? '로그인 안내' : '사이드바 열기'}
            >
              I:EUM
            </button>
          ) : (
            <Link
              href="/main"
              className="text-xl font-bold bg-gradient-to-r from-purple-600 to-violet-500 bg-clip-text text-transparent hover:from-purple-700 hover:to-violet-600 transition-all"
            >
              I:EUM
            </Link>
          )}
        </div>

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
                onClick={handleLogoutClick}
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

      {/* 로그아웃 확인 모달 */}
      <LogoutModal
        isOpen={showLogoutModal}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
      />
    </nav>
  );
}

