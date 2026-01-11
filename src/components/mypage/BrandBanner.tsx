'use client';

// ============================================
// Brand Banner Component
// ============================================

interface BrandBannerProps {
  bannerUrl?: string;
  placeholderText?: string;
}

export function BrandBanner({
  bannerUrl,
  placeholderText = '브랜드 배너',
}: BrandBannerProps) {
  return (
    <div className="w-full h-40 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
      {bannerUrl ? (
        <img
          src={bannerUrl}
          alt={placeholderText}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400">
          <div className="text-center">
            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm">{placeholderText}</span>
          </div>
        </div>
      )}
    </div>
  );
}
