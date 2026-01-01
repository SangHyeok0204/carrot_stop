'use client';

export function PlaceholderSection() {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-purple-50 to-white">
      <div className="max-w-6xl mx-auto">
        {/* 섹션 헤더 */}
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
            성과와 신뢰 지표
          </h2>
          <p className="text-gray-500">준비 중입니다</p>
        </div>

        {/* 스켈레톤 카드들 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-6 shadow-sm border border-purple-100"
            >
              {/* 아이콘 스켈레톤 */}
              <div className="w-12 h-12 bg-purple-100 rounded-xl mb-4 animate-pulse" />

              {/* 숫자 스켈레톤 */}
              <div className="h-8 w-24 bg-purple-50 rounded-lg mb-2 animate-pulse" />

              {/* 라벨 스켈레톤 */}
              <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Coming Soon 메시지 */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm">
            <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
            곧 업데이트 예정
          </div>
        </div>
      </div>
    </section>
  );
}
