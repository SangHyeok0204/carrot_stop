'use client';

import { memo } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';

// ============================================
// Portfolio Banner Component
// 대표 콘텐츠 썸네일 3~5개
// ============================================

interface PortfolioBannerProps {
  portfolioItems?: Array<{
    id: string;
    imageUrl: string;
    contentUrl?: string; // 원본 콘텐츠 링크
    title?: string;
  }>;
}

export const PortfolioBanner = memo(function PortfolioBanner({ portfolioItems = [] }: PortfolioBannerProps) {
  // 포트폴리오가 없으면 placeholder
  if (portfolioItems.length === 0) {
    return (
      <Card className="p-6 bg-gray-50 border-gray-200">
        <div className="flex items-center justify-center h-32 text-gray-400">
          <div className="text-center">
            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">포트폴리오 콘텐츠가 없습니다</p>
          </div>
        </div>
      </Card>
    );
  }

  // 최대 5개까지만 표시
  const itemsToShow = portfolioItems.slice(0, 5);

  return (
    <Card className="p-4 bg-white border-gray-200">
      <h3 className="text-sm font-medium text-gray-500 mb-4">대표 포트폴리오</h3>
      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
        {itemsToShow.map((item) => {
          const content = (
            <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group cursor-pointer">
              <Image
                src={item.imageUrl}
                alt={item.title || '포트폴리오'}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-200"
                sizes="(max-width: 768px) 33vw, 20vw"
              />
              {/* 호버 시 링크 아이콘 */}
              {item.contentUrl && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
              )}
            </div>
          );

          if (item.contentUrl) {
            return (
              <a
                key={item.id}
                href={item.contentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                {content}
              </a>
            );
          }

          return <div key={item.id}>{content}</div>;
        })}
      </div>
    </Card>
  );
});

