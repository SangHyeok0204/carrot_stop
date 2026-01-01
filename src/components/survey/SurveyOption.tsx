'use client';

import { ReactNode } from 'react';

interface SurveyOptionProps {
  id: string;
  label: string;
  icon?: ReactNode;        // 이모지, 아이콘, 또는 커스텀 컴포넌트
  image?: string;          // 이미지 URL (나중에 사용)
  selected?: boolean;
  onClick: (id: string) => void;
}

export function SurveyOption({
  id,
  label,
  icon,
  image,
  selected = false,
  onClick,
}: SurveyOptionProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      className={`
        relative flex flex-col items-center justify-center
        p-6 rounded-2xl border-2 transition-all duration-200
        min-w-[120px] min-h-[140px]
        cursor-pointer
        ${selected
          ? 'border-purple-500 bg-purple-50 shadow-lg scale-105'
          : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-md hover:scale-[1.02]'
        }
      `}
    >
      {/* 선택 체크 표시 */}
      {selected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {/* 아이콘/이미지 영역 */}
      <div className="flex-1 flex items-center justify-center mb-3">
        {image ? (
          <img src={image} alt={label} className="w-16 h-16 object-contain" />
        ) : icon ? (
          <div className="text-4xl">{icon}</div>
        ) : (
          // 플레이스홀더 (나중에 이미지/아이콘 추가용)
          <div className={`
            w-16 h-16 rounded-xl
            ${selected ? 'bg-purple-200' : 'bg-gray-100'}
            transition-colors duration-200
          `} />
        )}
      </div>

      {/* 라벨 */}
      <span className={`
        text-sm font-medium text-center
        ${selected ? 'text-purple-700' : 'text-gray-700'}
      `}>
        {label}
      </span>
    </button>
  );
}
