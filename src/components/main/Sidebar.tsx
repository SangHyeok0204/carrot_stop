'use client';

import Link from 'next/link';

// ============================================
// Types
// ============================================

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

// ============================================
// Sidebar Component
// ============================================

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  return (
    <>
      {/* 토글 버튼 - 사이드바 상태에 따라 위치/방향 변경 */}
      <button
        onClick={onToggle}
        className={`
          fixed top-1/2 -translate-y-1/2 z-50
          w-4 h-16
          bg-white border border-gray-200
          shadow-md
          flex items-center justify-center
          hover:bg-gray-50 active:bg-gray-100
          transition-all duration-300 ease-in-out
          group
          ${isOpen
            ? 'left-60 border-l-0 rounded-r-md'
            : 'left-0 border-r-0 rounded-r-md'
          }
        `}
        aria-label={isOpen ? '사이드바 닫기' : '사이드바 열기'}
      >
        {/* 화살표 아이콘 - 열림: 왼쪽(<), 닫힘: 오른쪽(>) */}
        <svg
          className="w-3 h-3 text-gray-400 group-hover:text-gray-600 transition-colors"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={isOpen ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"}
          />
        </svg>
      </button>

      {/* 사이드바 패널 */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-60
          bg-white border-r border-gray-200
          shadow-lg z-40
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* 헤더 */}
        <div className="flex items-center p-4 border-b border-gray-100">
          <Link href="/main" className="text-xl font-bold text-gray-900">
            I:EUM
          </Link>
        </div>

        {/* 메뉴 아이템 */}
        <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100%-8rem)]">
          <SidebarItem icon="🏠" label="홈" href="/main" />
          <SidebarItem icon="📢" label="캠페인 탐색" href="/campaigns" />
          <SidebarItem icon="⭐" label="즐겨찾기" href="#" />
          <SidebarItem icon="📊" label="내 활동" href="#" />

          <div className="pt-4 border-t border-gray-100 mt-4">
            <p className="text-xs text-gray-400 uppercase font-medium mb-2 px-3">카테고리</p>
            <SidebarItem icon="☕" label="카페" href="/campaigns/category/카페" />
            <SidebarItem icon="🍜" label="음식점" href="/campaigns/category/음식점" />
            <SidebarItem icon="🍸" label="바/주점" href="/campaigns/category/바/주점" />
            <SidebarItem icon="💄" label="뷰티/미용" href="/campaigns/category/뷰티/미용" />
            <SidebarItem icon="👗" label="패션/의류" href="/campaigns/category/패션/의류" />
          </div>

          <div className="pt-4 border-t border-gray-100 mt-4">
            <p className="text-xs text-gray-400 uppercase font-medium mb-2 px-3">설정</p>
            <SidebarItem icon="⚙️" label="설정" href="#" />
            <SidebarItem icon="❓" label="도움말" href="#" />
          </div>
        </nav>

        {/* 하단 영역 */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-400 text-center">
            © 2026 I:EUM
          </p>
        </div>
      </aside>
    </>
  );
}

// ============================================
// Sidebar Item Component
// ============================================

interface SidebarItemProps {
  icon: string;
  label: string;
  href: string;
  active?: boolean;
}

function SidebarItem({ icon, label, href, active = false }: SidebarItemProps) {
  return (
    <Link
      href={href}
      className={`
        flex items-center gap-3 px-3 py-2.5 rounded-lg
        transition-colors duration-200
        ${active
          ? 'bg-purple-100 text-purple-700'
          : 'text-gray-700 hover:bg-gray-100'
        }
      `}
    >
      <span className="text-lg">{icon}</span>
      <span className="font-medium text-sm">{label}</span>
    </Link>
  );
}

// ============================================
// Toggle Button (External) - 필요시 사용
// ============================================

interface SidebarToggleProps {
  onClick: () => void;
  className?: string;
}

export function SidebarToggle({ onClick, className = '' }: SidebarToggleProps) {
  return (
    <button
      onClick={onClick}
      className={`
        p-2 rounded-lg
        hover:bg-gray-100 active:bg-gray-200
        transition-colors duration-200
        ${className}
      `}
      aria-label="메뉴 열기"
    >
      <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  );
}
