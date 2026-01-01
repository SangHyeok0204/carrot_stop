'use client';

import { ReactNode } from 'react';

interface SurveyQuestionProps {
  icon?: ReactNode;        // 감정 앵커용 아이콘
  question: string;
  description?: string;
}

export function SurveyQuestion({ icon, question, description }: SurveyQuestionProps) {
  return (
    <div className="text-center space-y-4">
      {/* 감정 앵커 (아이콘 + 구분선) */}
      {icon && (
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="text-3xl">{icon}</div>
          <div className="w-12 h-px bg-purple-200" />
        </div>
      )}

      {/* 질문 텍스트 */}
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 leading-tight">
        {question}
      </h2>

      {/* 부가 설명 (선택적) */}
      {description && (
        <p className="text-gray-500 text-sm sm:text-base max-w-md mx-auto">
          {description}
        </p>
      )}
    </div>
  );
}
