'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// ============================================
// Influencer Requirements Component
// 구하고자 하는 인플루언서 상
// ============================================

interface InfluencerRequirementsProps {
  platforms?: string[];
  followerRange?: string;
  contentStyle?: string[];
  mustHave?: string[];
  niceToHave?: string[];
  demographics?: string;
  interests?: string[];
}

export function InfluencerRequirements({
  platforms,
  followerRange,
  contentStyle,
  mustHave,
  niceToHave,
  demographics,
  interests,
}: InfluencerRequirementsProps) {
  // 모든 필드가 비어있으면 렌더링하지 않음
  const hasContent = platforms?.length || followerRange || contentStyle?.length ||
    mustHave?.length || niceToHave?.length || demographics || interests?.length;

  if (!hasContent) {
    return null;
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">찾고 있는 인플루언서</h2>

      <div className="space-y-5">
        {/* 플랫폼 */}
        {platforms && platforms.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">활동 플랫폼</h3>
            <div className="flex flex-wrap gap-2">
              {platforms.map((platform, idx) => (
                <Badge key={idx} variant="outline" className="text-gray-700">
                  {platform}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* 팔로워 기준 */}
        {followerRange && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">팔로워 기준</h3>
            <p className="text-gray-700">{followerRange}</p>
          </div>
        )}

        {/* 타겟 오디언스 */}
        {demographics && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">타겟 오디언스</h3>
            <p className="text-gray-700">{demographics}</p>
          </div>
        )}

        {/* 관심사 */}
        {interests && interests.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">관련 관심사</h3>
            <div className="flex flex-wrap gap-2">
              {interests.map((interest, idx) => (
                <Badge key={idx} className="bg-blue-50 text-blue-700 border-blue-200">
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* 콘텐츠 스타일 */}
        {contentStyle && contentStyle.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">콘텐츠 스타일</h3>
            <div className="flex flex-wrap gap-2">
              {contentStyle.map((style, idx) => (
                <Badge key={idx} className="bg-purple-50 text-purple-700 border-purple-200">
                  {style}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* 필수 조건 */}
        {mustHave && mustHave.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-green-600 mb-2">필수 조건</h3>
            <ul className="space-y-2">
              {mustHave.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-gray-700">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 우대 조건 */}
        {niceToHave && niceToHave.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-blue-600 mb-2">우대 조건</h3>
            <ul className="space-y-2">
              {niceToHave.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-gray-700">
                  <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}
