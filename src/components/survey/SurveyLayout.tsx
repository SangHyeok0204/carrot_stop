'use client';

import { ReactNode } from 'react';
import { SurveyProgress } from './SurveyProgress';

interface SurveyLayoutProps {
  children: ReactNode;
  currentStep: number;
  totalSteps: number;
  onPrevious?: () => void;
  onSkip?: () => void;
  showPrevious?: boolean;
  showSkip?: boolean;
}

export function SurveyLayout({
  children,
  currentStep,
  totalSteps,
  onPrevious,
  onSkip,
  showPrevious = true,
  showSkip = true,
}: SurveyLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-purple-50 relative overflow-hidden">
      {/* 배경 장식 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-purple-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-violet-200/20 rounded-full blur-3xl" />
      </div>

      {/* 메인 컨테이너 */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* 상단: 진행률 */}
        <header className="pt-8 pb-4">
          <SurveyProgress current={currentStep} total={totalSteps} />
        </header>

        {/* 중앙: 컨텐츠 영역 */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          {children}
        </main>

        {/* 하단: 네비게이션 */}
        <footer className="pb-8 px-4">
          <div className="flex justify-center items-center gap-4">
            {showPrevious && currentStep > 1 && (
              <button
                onClick={onPrevious}
                className="px-6 py-2 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
              >
                이전
              </button>
            )}
            {showSkip && (
              <button
                onClick={onSkip}
                className="px-6 py-2 text-gray-400 hover:text-gray-600 text-sm transition-colors"
              >
                건너뛰기
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
