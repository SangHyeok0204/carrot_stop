'use client';

import { Card } from '@/components/ui/card';

// ============================================
// Process Guide Component
// 진행 방식 & 제출물 안내
// ============================================

interface ContentType {
  platform: string;
  format: string;
  rationale?: string;
}

interface ProcessGuideProps {
  contentTypes?: ContentType[];
  submissionMethod?: string;
  revisionPolicy?: string;
  timeline?: Array<{ phase: string; description?: string }>;
  estimatedDays?: number;
  mustNot?: string[];
}

export function ProcessGuide({
  contentTypes,
  submissionMethod,
  revisionPolicy,
  timeline,
  estimatedDays,
  mustNot,
}: ProcessGuideProps) {
  // 모든 필드가 비어있으면 렌더링하지 않음
  const hasContent = contentTypes?.length || submissionMethod || revisionPolicy ||
    timeline?.length || estimatedDays || mustNot?.length;

  if (!hasContent) {
    return null;
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">진행 방식</h2>

      <div className="space-y-6">
        {/* 콘텐츠 형태 */}
        {contentTypes && contentTypes.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3">콘텐츠 형태</h3>
            <div className="space-y-3">
              {contentTypes.map((type, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{type.platform}</p>
                    <p className="text-sm text-gray-600">{type.format}</p>
                    {type.rationale && (
                      <p className="text-sm text-gray-500 mt-1">{type.rationale}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 예상 기간 */}
        {estimatedDays && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">예상 기간</h3>
            <p className="text-gray-700">약 {estimatedDays}일</p>
          </div>
        )}

        {/* 제출 방식 */}
        {submissionMethod && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">제출 방식</h3>
            <p className="text-gray-700">{submissionMethod}</p>
          </div>
        )}

        {/* 수정 정책 */}
        {revisionPolicy && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">수정 정책</h3>
            <p className="text-gray-700">{revisionPolicy}</p>
          </div>
        )}

        {/* 일정 흐름 */}
        {timeline && timeline.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3">진행 일정</h3>
            <div className="relative">
              {/* 타임라인 라인 */}
              <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-200" />

              <div className="space-y-4">
                {timeline.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4 relative">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center z-10">
                      <span className="text-sm font-medium text-purple-600">{idx + 1}</span>
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="font-medium text-gray-900">{item.phase}</p>
                      {item.description && (
                        <p className="text-sm text-gray-600 mt-0.5">{item.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 금지 사항 */}
        {mustNot && mustNot.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-red-600 mb-2">금지 사항</h3>
            <ul className="space-y-2">
              {mustNot.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-gray-700">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
