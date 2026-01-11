'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// ============================================
// Fixed CTA Component
// 데스크탑: 우측 고정 / 모바일: 하단 고정
// ============================================

interface FixedCTAProps {
  campaignId: string;
  status: string;
  isOwner: boolean;
  isInfluencer: boolean;
  hasApplied: boolean;
  isLoggedIn: boolean;
  budget?: string;
  estimatedDays?: number;
  onApply: () => void;
  applying?: boolean;
}

export function FixedCTA({
  campaignId,
  status,
  isOwner,
  isInfluencer,
  hasApplied,
  isLoggedIn,
  budget,
  estimatedDays,
  onApply,
  applying = false,
}: FixedCTAProps) {
  const canApply = isInfluencer && status === 'OPEN' && !hasApplied && !isOwner;

  // CTA 버튼 렌더링
  const renderCTAButton = () => {
    if (canApply) {
      return (
        <Button
          onClick={onApply}
          disabled={applying}
          className="w-full py-6 text-lg font-bold bg-purple-600 hover:bg-purple-700"
        >
          {applying ? '지원 중...' : '지원하기'}
        </Button>
      );
    }

    if (hasApplied) {
      return (
        <div className="w-full py-4 px-6 bg-green-50 text-green-700 font-medium rounded-lg text-center">
          이미 지원했습니다
        </div>
      );
    }

    if (isOwner) {
      return (
        <Link href={`/advertiser/campaigns/${campaignId}`} className="block w-full">
          <Button className="w-full py-6 text-lg font-bold bg-purple-600 hover:bg-purple-700">
            캠페인 관리하기
          </Button>
        </Link>
      );
    }

    if (!isLoggedIn) {
      return (
        <Link href="/auth/login" className="block w-full">
          <Button className="w-full py-6 text-lg font-bold bg-purple-600 hover:bg-purple-700">
            로그인하고 지원하기
          </Button>
        </Link>
      );
    }

    if (status !== 'OPEN') {
      return (
        <div className="w-full py-4 px-6 bg-gray-100 text-gray-500 font-medium rounded-lg text-center">
          모집이 마감되었습니다
        </div>
      );
    }

    return (
      <div className="w-full py-4 px-6 bg-gray-100 text-gray-500 font-medium rounded-lg text-center">
        지원할 수 없습니다
      </div>
    );
  };

  return (
    <>
      {/* 데스크탑: 우측 고정 사이드바 */}
      <div className="hidden lg:block">
        <div className="sticky top-24">
          <Card className="p-6">
            {/* 예산 정보 */}
            {budget && (
              <div className="mb-4">
                <p className="text-sm text-gray-500">보상</p>
                <p className="text-2xl font-bold text-gray-900">{budget}</p>
              </div>
            )}

            {/* 기간 정보 */}
            {estimatedDays && (
              <div className="mb-6 pb-6 border-b border-gray-100">
                <p className="text-sm text-gray-500">예상 기간</p>
                <p className="text-lg font-semibold text-gray-900">약 {estimatedDays}일</p>
              </div>
            )}

            {/* CTA 버튼 */}
            {renderCTAButton()}

            {/* 문의 버튼 */}
            <Button
              variant="outline"
              className="w-full mt-3 py-3"
            >
              문의하기
            </Button>
          </Card>
        </div>
      </div>

      {/* 모바일: 하단 고정 */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 p-4 safe-area-pb">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          {/* 예산 정보 (간단히) */}
          {budget && (
            <div className="flex-shrink-0">
              <p className="text-xs text-gray-500">보상</p>
              <p className="font-bold text-gray-900">{budget}</p>
            </div>
          )}

          {/* CTA 버튼 */}
          <div className="flex-1">
            {canApply ? (
              <Button
                onClick={onApply}
                disabled={applying}
                className="w-full py-3 font-bold bg-purple-600 hover:bg-purple-700"
              >
                {applying ? '지원 중...' : '지원하기'}
              </Button>
            ) : hasApplied ? (
              <div className="w-full py-3 px-4 bg-green-50 text-green-700 font-medium rounded-lg text-center text-sm">
                이미 지원했습니다
              </div>
            ) : isOwner ? (
              <Link href={`/advertiser/campaigns/${campaignId}`} className="block w-full">
                <Button className="w-full py-3 font-bold bg-purple-600 hover:bg-purple-700">
                  캠페인 관리
                </Button>
              </Link>
            ) : !isLoggedIn ? (
              <Link href="/auth/login" className="block w-full">
                <Button className="w-full py-3 font-bold bg-purple-600 hover:bg-purple-700">
                  로그인하고 지원
                </Button>
              </Link>
            ) : (
              <div className="w-full py-3 px-4 bg-gray-100 text-gray-500 font-medium rounded-lg text-center text-sm">
                {status !== 'OPEN' ? '모집 마감' : '지원 불가'}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
