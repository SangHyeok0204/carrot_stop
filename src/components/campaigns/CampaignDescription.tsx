'use client';

import { Card } from '@/components/ui/card';

// ============================================
// Campaign Description Component
// 캠페인 상세 설명
// ============================================

interface CampaignDescriptionProps {
  background?: string;      // 캠페인 배경
  productInfo?: string;     // 제품/서비스 설명
  coreMessage?: string;     // 전달하고 싶은 메시지
  description?: string;     // 기본 설명 (fallback)
}

export function CampaignDescription({
  background,
  productInfo,
  coreMessage,
  description,
}: CampaignDescriptionProps) {
  // 모든 필드가 비어있으면 렌더링하지 않음
  if (!background && !productInfo && !coreMessage && !description) {
    return null;
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">캠페인 상세</h2>

      <div className="space-y-6">
        {/* 캠페인 배경 */}
        {background && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">캠페인 배경</h3>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{background}</p>
          </div>
        )}

        {/* 제품/서비스 설명 */}
        {productInfo && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">제품/서비스</h3>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{productInfo}</p>
          </div>
        )}

        {/* 전달하고 싶은 메시지 */}
        {coreMessage && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">핵심 메시지</h3>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{coreMessage}</p>
          </div>
        )}

        {/* 기본 설명 (다른 필드가 없을 때) */}
        {!background && !productInfo && !coreMessage && description && (
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{description}</p>
        )}
      </div>
    </Card>
  );
}
