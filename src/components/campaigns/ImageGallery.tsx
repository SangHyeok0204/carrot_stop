'use client';

// ============================================
// Image Gallery Component (Airbnb Style)
// ============================================

interface ImageGalleryProps {
  mainImage?: string;
  images?: string[];
  title: string;
  category?: string;
}

// 카테고리별 그라데이션
const categoryGradients: Record<string, string> = {
  '카페': 'from-amber-400 to-orange-300',
  '음식점': 'from-orange-400 to-red-300',
  '바/주점': 'from-purple-400 to-violet-300',
  '뷰티/미용': 'from-pink-400 to-rose-300',
  '패션/의류': 'from-rose-400 to-pink-300',
  '스포츠/피트니스': 'from-green-400 to-emerald-300',
  '페스티벌/행사': 'from-violet-400 to-purple-300',
  '서포터즈': 'from-blue-400 to-cyan-300',
  '리뷰/체험단': 'from-teal-400 to-cyan-300',
  '기타': 'from-slate-400 to-gray-300',
};

export function ImageGallery({ mainImage, images = [], title, category = '기타' }: ImageGalleryProps) {
  const gradient = categoryGradients[category] || categoryGradients['기타'];
  const allImages = mainImage ? [mainImage, ...images] : images;
  const hasMultipleImages = allImages.length > 1;

  // 단일 이미지 또는 이미지 없음
  if (allImages.length <= 1) {
    return (
      <div className="w-full h-64 md:h-80 lg:h-96 relative overflow-hidden">
        {mainImage ? (
          <img
            src={mainImage}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradient}`}>
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
              <div className="w-32 h-32 bg-white/30 rounded-full" />
            </div>
          </div>
        )}
      </div>
    );
  }

  // 다중 이미지 (Airbnb 스타일 그리드)
  return (
    <div className="w-full h-64 md:h-80 lg:h-[28rem] relative overflow-hidden">
      <div className="grid grid-cols-4 grid-rows-2 gap-1 h-full">
        {/* 메인 이미지 (좌측 큰 이미지) */}
        <div className="col-span-2 row-span-2 relative">
          <img
            src={allImages[0]}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* 보조 이미지들 */}
        {allImages.slice(1, 5).map((img, idx) => (
          <div key={idx} className="relative">
            <img
              src={img}
              alt={`${title} ${idx + 2}`}
              className="w-full h-full object-cover"
            />
            {/* 더보기 오버레이 (4번째 이미지에만) */}
            {idx === 3 && allImages.length > 5 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white font-medium">+{allImages.length - 5}</span>
              </div>
            )}
          </div>
        ))}

        {/* 빈 슬롯 채우기 */}
        {allImages.length < 5 && Array.from({ length: 5 - allImages.length }).map((_, idx) => (
          <div key={`empty-${idx}`} className={`bg-gradient-to-br ${gradient} opacity-50`} />
        ))}
      </div>
    </div>
  );
}
