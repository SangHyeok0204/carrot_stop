'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserRole } from '@/contexts/AuthContext';

// ============================================
// Types
// ============================================

export interface ProfileUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL?: string;
  bio?: string;
  // 광고주용
  companyName?: string;
  // 인플루언서용
  nickname?: string;
  followerCount?: number;
  platforms?: string[]; // ['Instagram', 'YouTube', 'TikTok']
}

interface ProfileCardProps {
  user: ProfileUser;
  role: UserRole;
}

// ============================================
// Platform Icon Component
// ============================================

const PlatformIcon = ({ platform }: { platform: string }) => {
  const platformLower = platform?.toLowerCase() || '';

  if (platformLower.includes('instagram')) {
    return (
      <svg className="w-5 h-5 text-pink-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    );
  }

  if (platformLower.includes('youtube')) {
    return (
      <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    );
  }

  if (platformLower.includes('tiktok')) {
    return (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
      </svg>
    );
  }

  return null;
};

// ============================================
// Component
// ============================================

export function ProfileCard({ user, role }: ProfileCardProps) {
  // 인플루언서의 경우 활동명 결정
  const displayName = role === 'influencer'
    ? (user.nickname || user.displayName || '인플루언서')
    : (user.companyName || user.displayName || '광고주');

  const initial = displayName.charAt(0).toUpperCase();

  // 한 줄 정체성 설명 (bio 또는 기본값)
  const identityDescription = user.bio || '인플루언서';

  return (
    <Card className="p-6 bg-white border-gray-200">
      <div className="flex items-start gap-5">
        {/* 프로필 이미지 */}
        <div className="flex-shrink-0">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={displayName}
              className="w-20 h-20 rounded-full object-cover border-2 border-gray-100"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center border-2 border-gray-100">
              <span className="text-2xl font-bold text-purple-600">{initial}</span>
            </div>
          )}
        </div>

        {/* 정보 영역 */}
        <div className="flex-1 min-w-0">
          {/* 활동명 + 역할 배지 */}
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-xl font-bold text-gray-900 truncate">{displayName}</h2>
            <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">
              인플루언서
            </Badge>
          </div>

          {/* 한 줄 정체성 설명 */}
          <p className="text-sm text-gray-600 mb-4">
            {identityDescription}
          </p>

          {/* 핵심 지표 */}
          <div className="flex items-center gap-6 mb-4">
            {/* 팔로워 수 */}
            {user.followerCount !== undefined && (
              <div>
                <p className="text-xs text-gray-500 mb-1">팔로워</p>
                <p className="text-lg font-semibold text-gray-900">
                  {user.followerCount.toLocaleString()}
                </p>
              </div>
            )}

            {/* 주요 활동 플랫폼 */}
            {user.platforms && user.platforms.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-1">활동 플랫폼</p>
                <div className="flex items-center gap-2">
                  {user.platforms.slice(0, 3).map((platform, idx) => (
                    <div key={idx} className="flex items-center">
                      <PlatformIcon platform={platform} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 연락 수단 (이메일) */}
          {user.email && (
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="truncate">{user.email}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
