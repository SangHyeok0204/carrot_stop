'use client';

interface SurveyProgressProps {
  current: number;
  total: number;
}

export function SurveyProgress({ current, total }: SurveyProgressProps) {
  const progress = (current / total) * 100;

  return (
    <div className="w-full max-w-md mx-auto px-4">
      {/* 진행 상태 텍스트 */}
      <div className="flex justify-between items-center mb-2 text-sm text-gray-500">
        <span>{current} / {total}</span>
        <span>{Math.round(progress)}%</span>
      </div>

      {/* 프로그레스 바 */}
      <div className="relative h-2 bg-purple-100 rounded-full overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-purple-500 to-violet-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
