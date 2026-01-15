'use client';

import { useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { LogoutModal } from '@/components/ui/logout-modal';
import { Logo } from './Logo';

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
// Navigation Menu Items (Communique 스타일)
// ============================================

const navItems = [
  { label: 'Home', href: '/main' },
  { label: 'About Us', href: '/about' },
  { label: 'Services', href: '/services' },
  { label: 'Client', href: '/client' },
  { label: 'Contact Us', href: '/contact' },
];

// ============================================
// Component
// ============================================

interface TopNavProps {
  transparent?: boolean;
  className?: string;
  onMenuClick?: () => void;
  isSidebarOpen?: boolean;
  isAuthenticated?: boolean;
  role?: UserRole;
  userEmail?: string;
  userName?: string;
}

export function TopNav({ 
  transparent = false, 
  className = '', 
  onMenuClick, 
  isSidebarOpen = false,
  role,
  userEmail,
  userName,
}: TopNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isLoggedIn, logout, getMyPagePath } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    ? 'bg-white/90 backdrop-blur-md border-b border-purple-100/50'
    : 'bg-white border-b border-purple-100';

  const currentUser = user || (role ? { role, email: userEmail, displayName: userName } : null);
  const currentIsLoggedIn = isLoggedIn || !!role;

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 ${bgClass} ${className}`}>
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* 좌측: 로고 */}
        <div className="flex items-center gap-8">
          {onMenuClick && !isSidebarOpen ? (
            <Logo onClick={onMenuClick} />
          ) : (
            <Logo href="/" />
          )}

          {/* 데스크탑 네비게이션 메뉴 */}
          <div className="hidden lg:flex items-center gap-6">
            {navItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href === '/' && pathname === '/') ||
                (item.href !== '/' && pathname?.startsWith(item.href));
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    text-sm font-medium transition-colors
                    ${isActive 
                      ? 'text-purple-600 border-b-2 border-purple-600 pb-1' 
                      : 'text-gray-700 hover:text-purple-600'
                    }
                  `}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* 우측: 언어 선택 + 인증 영역 */}
        <div className="flex items-center gap-4">
          {/* 언어 선택 (Communique 스타일) */}
          <div className="hidden md:flex items-center gap-2 text-sm">
            <button className="text-gray-700 hover:text-purple-600 transition-colors font-medium">
              KOR
            </button>
            <span className="text-gray-300">|</span>
            <button className="text-gray-400 hover:text-purple-600 transition-colors">
              ENG
            </button>
          </div>

          {/* 인증 영역 */}
          {isLoading ? (
            <div className="w-20 h-9 bg-purple-100 rounded-lg animate-pulse" />
          ) : currentUser ? (
            <>
              {/* Role 뱃지 */}
              {currentUser.role && (
                <span className={`hidden sm:inline-flex px-3 py-1 rounded-full text-xs font-medium border ${roleConfig[currentUser.role].className}`}>
                  {roleConfig[currentUser.role].label}
                </span>
              )}

              {/* 사용자 이름 */}
              <span className="hidden md:block text-sm text-gray-600">
                {currentUser.displayName || currentUser.email}
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

          {/* 모바일 메뉴 버튼 */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-gray-700 hover:text-purple-600"
            aria-label="메뉴 열기"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* 모바일 메뉴 */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-purple-100 bg-white">
          <div className="px-4 py-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  block px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${pathname === item.href 
                    ? 'text-purple-600 bg-purple-50' 
                    : 'text-gray-700 hover:bg-purple-50 hover:text-purple-600'
                  }
                `}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 로그아웃 확인 모달 */}
      <LogoutModal
        isOpen={showLogoutModal}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
      />
    </nav>
  );
}

