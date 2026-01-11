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
}

interface ProfileCardProps {
  user: ProfileUser;
  role: UserRole;
  // TODO: 실제 데이터 연동 시 사용
  followerCount?: number;
  followingCount?: number;
}

// ============================================
// Role Config
// ============================================

const roleConfig: Record<UserRole, { label: string; badgeClass: string }> = {
  advertiser: {
    label: '광고주',
    badgeClass: 'bg-purple-100 text-purple-700 border-purple-200',
  },
  influencer: {
    label: '인플루언서',
    badgeClass: 'bg-pink-100 text-pink-700 border-pink-200',
  },
  admin: {
    label: '관리자',
    badgeClass: 'bg-gray-100 text-gray-700 border-gray-200',
  },
};

// ============================================
// Component
// ============================================

export function ProfileCard({
  user,
  role,
  followerCount = 128,  // TODO: 실제 데이터 연동
  followingCount = 45,   // TODO: 실제 데이터 연동
}: ProfileCardProps) {
  // 역할에 따른 표시 이름 결정
  const displayName = role === 'advertiser'
    ? (user.companyName || user.displayName || '광고주')
    : (user.nickname || user.displayName || '인플루언서');

  const initial = displayName.charAt(0).toUpperCase();
  const config = roleConfig[role];

  // 인플루언서의 경우 실제 팔로워 수 사용
  const actualFollowerCount = role === 'influencer' && user.followerCount
    ? user.followerCount
    : followerCount;

  return (
    <Card className="p-6 bg-white border-gray-200">
      <div className="flex items-start gap-5">
        {/* 아바타 */}
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
          {/* 상단: 이름 + 뱃지 */}
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-lg font-bold text-gray-900 truncate">{displayName}</h2>
            <Badge className={`${config.badgeClass} text-xs`}>
              {config.label}
            </Badge>
          </div>

          {/* 팔로워/팔로잉 */}
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
            <span>
              <strong className="text-gray-900">{actualFollowerCount.toLocaleString()}</strong> 팔로워
            </span>
            <span>
              <strong className="text-gray-900">{followingCount.toLocaleString()}</strong> 팔로잉
            </span>
          </div>

          {/* 상태 메시지 (bio) */}
          {user.bio ? (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{user.bio}</p>
          ) : (
            <p className="text-sm text-gray-400 mb-3">한 줄 소개를 입력해주세요</p>
          )}

          {/* 문의 정보 */}
          <div className="text-sm text-gray-500 space-y-1">
            {user.email && (
              <p className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {user.email}
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
