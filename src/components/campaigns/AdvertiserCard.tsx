'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';

// ============================================
// Advertiser Card Component
// 광고주 요약 & 신뢰 요소
// ============================================

interface AdvertiserCardProps {
  name: string;
  description?: string;
  photoUrl?: string;
  rating?: number;
  reviewCount?: number;
  advertiserId?: string;
}

export function AdvertiserCard({
  name,
  description,
  photoUrl,
  rating,
  reviewCount = 0,
  advertiserId,
}: AdvertiserCardProps) {
  const initial = name.charAt(0).toUpperCase();

  return (
    <Card className="p-5">
      <div className="flex items-start gap-4">
        {/* 아바타 */}
        <div className="flex-shrink-0">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={name}
              className="w-14 h-14 rounded-full object-cover"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center">
              <span className="text-xl font-bold text-purple-600">{initial}</span>
            </div>
          )}
        </div>

        {/* 정보 */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900">{name}</h3>

          {/* 평점 */}
          {rating !== undefined ? (
            <div className="flex items-center gap-1 mt-1">
              <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
              </svg>
              <span className="text-sm font-medium text-gray-900">{rating.toFixed(1)}</span>
              <span className="text-sm text-gray-500">({reviewCount}개 리뷰)</span>
            </div>
          ) : (
            <p className="text-sm text-gray-400 mt-1">아직 리뷰가 없습니다</p>
          )}

          {/* 한 줄 소개 */}
          {description && (
            <p className="text-sm text-gray-600 mt-2 line-clamp-2">{description}</p>
          )}
        </div>
      </div>

      {/* 프로필 보기 링크 */}
      {advertiserId && (
        <Link
          href={`/advertisers/${advertiserId}`}
          className="block mt-4 pt-4 border-t border-gray-100 text-center text-sm font-medium text-purple-600 hover:text-purple-700"
        >
          회사 프로필 보기
        </Link>
      )}
    </Card>
  );
}
