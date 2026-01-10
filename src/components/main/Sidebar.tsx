'use client';

import Link from 'next/link';

// ============================================
// Types
// ============================================

type UserRole = 'advertiser' | 'influencer' | 'admin';

interface SidebarCampaignItem {
  id: string;
  title: string;
}

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isAuthenticated: boolean;
  userRole: UserRole | null;
  // 광고주용: 내가 등록한 캠페인 리스트
  myCampaigns?: SidebarCampaignItem[];
  // 인플루언서용: 내가 신청/계약한 캠페인 리스트
  myApplications?: SidebarCampaignItem[];
}

// ============================================
// Sidebar Component
// ============================================

export function Sidebar({
  isOpen,
  onToggle,
  isAuthenticated,
  userRole,
  myCampaigns = [],
  myApplications = [],
}: SidebarProps) {
  // 비로그인 상태에서는 사이드바와 토글 버튼 모두 렌더링하지 않음
  if (!isAuthenticated) {
    return null;
  }

  // role에 따른 중간 리스트 데이터 결정
  const listTitle =
    userRole === 'advertiser'
      ? '내가 등록한 캠페인'
      : userRole === 'influencer'
      ? '내가 신청한 캠페인'
      : '관리 중인 캠페인';

  const listItems = userRole === 'advertiser' ? myCampaigns : myApplications;

  // 클릭 시 이동할 경로 결정
  const getItemHref = (id: string) => {
    if (userRole === 'advertiser') {
      return `/advertiser/campaigns/${id}`;
    } else if (userRole === 'influencer') {
      return `/influencer/applications/${id}`;
    }
    return `/campaigns/${id}`;
  };

  return (
    <>
      {/* 토글 버튼 - 사이드바가 열려있을 때만 표시 (오른쪽 경계 중앙 네모 버튼) */}
      {isOpen && (
        <button
          onClick={onToggle}
          className="
            fixed top-1/2 -translate-y-1/2 z-50
            left-60
            w-5 h-10
            bg-white border border-gray-200 border-l-0
            rounded-r-md
            shadow-md
            flex items-center justify-center
            hover:bg-gray-50 active:bg-gray-100
            transition-all duration-200
            group
          "
          aria-label="사이드바 닫기"
        >
          {/* 네모 아이콘 (□) */}
          <div className="w-2.5 h-2.5 border-2 border-gray-400 group-hover:border-gray-600 rounded-sm transition-colors" />
        </button>
      )}

      {/* 사이드바 패널 */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-60
          bg-white border-r border-gray-200
          shadow-lg z-40
          flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* 헤더 - 로고 */}
        <div className="flex items-center p-4 border-b border-gray-100 shrink-0">
          <Link href="/main" className="text-xl font-bold text-gray-900">
            I:EUM
          </Link>
        </div>

        {/* 상단 고정 메뉴 */}
        <nav className="p-4 space-y-1 shrink-0">
          <SidebarItem icon="🏠" label="홈" href="/main" />
          <SidebarItem icon="📊" label="내 활동" href={userRole === 'advertiser' ? '/advertiser/dashboard' : '/influencer/feed'} />
          <SidebarItem icon="⭐" label="즐겨찾기" href="#" />
        </nav>

        {/* 구분선 */}
        <div className="border-t border-gray-100 mx-4" />

        {/* 중간 영역 - role 기반 리스트 (스크롤 가능) */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="px-4 pt-4 pb-2 shrink-0">
            <p className="text-xs text-gray-400 uppercase font-medium px-3">
              {listTitle}
            </p>
          </div>

          {/* 스크롤 가능한 리스트 영역 */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent hover:scrollbar-thumb-gray-300">
            {listItems.length === 0 ? (
              <p className="text-sm text-gray-400 px-3 py-2">
                {userRole === 'advertiser'
                  ? '등록한 캠페인이 없습니다'
                  : '신청한 캠페인이 없습니다'}
              </p>
            ) : (
              <div className="space-y-1">
                {listItems.map((item) => (
                  <Link
                    key={item.id}
                    href={getItemHref(item.id)}
                    className="
                      block px-3 py-2.5 rounded-lg
                      text-sm text-gray-700
                      hover:bg-gray-100
                      transition-colors duration-200
                      truncate
                    "
                    title={item.title}
                  >
                    <span className="mr-2 text-gray-400">•</span>
                    {item.title}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 구분선 */}
        <div className="border-t border-gray-100 mx-4" />

        {/* 하단 고정 메뉴 */}
        <nav className="p-4 space-y-1 shrink-0">
          <SidebarItem icon="⚙️" label="설정" href="#" />
          <SidebarItem icon="❓" label="도움말" href="#" />
        </nav>

        {/* 푸터 */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 shrink-0">
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
