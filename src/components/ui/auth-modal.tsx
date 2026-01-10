'use client';

import { useEffect, useCallback } from 'react';
import Link from 'next/link';

// ============================================
// Types
// ============================================

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ============================================
// Auth Modal Component
// ============================================

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  // ESC 키로 닫기
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <>
      {/* 오버레이 - 모달 자체에만 적용 */}
      <div
        className="fixed inset-0 bg-black/40 z-[60]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 모달 컨테이너 */}
      <div className="fixed inset-0 flex items-center justify-center z-[70] p-4">
        <div
          className="
            relative
            w-full max-w-sm
            bg-white rounded-2xl
            shadow-2xl
            p-6
            animate-in fade-in zoom-in-95 duration-200
          "
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
        >
          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            className="
              absolute top-4 right-4
              w-8 h-8 rounded-full
              flex items-center justify-center
              text-gray-400 hover:text-gray-600 hover:bg-gray-100
              transition-colors
            "
            aria-label="닫기"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* 로고 */}
          <div className="text-center mb-6">
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-violet-500 bg-clip-text text-transparent">
              I:EUM
            </span>
          </div>

          {/* 제목 */}
          <h2
            id="auth-modal-title"
            className="text-xl font-bold text-gray-900 text-center mb-2"
          >
            I:EUM 시작하기
          </h2>

          {/* 본문 */}
          <p className="text-gray-500 text-center text-sm mb-6">
            로그인 후 내 캠페인/활동을 관리할 수 있어요.
          </p>

          {/* 버튼 영역 */}
          <div className="flex flex-col gap-3">
            <Link
              href="/auth/login"
              className="
                w-full py-3 px-4
                bg-purple-600 text-white
                font-semibold text-center rounded-xl
                hover:bg-purple-700 active:scale-[0.98]
                transition-all duration-200
              "
              onClick={onClose}
            >
              로그인
            </Link>

            <Link
              href="/auth/signup"
              className="
                w-full py-3 px-4
                bg-gray-100 text-gray-800
                font-semibold text-center rounded-xl
                hover:bg-gray-200 active:scale-[0.98]
                transition-all duration-200
              "
              onClick={onClose}
            >
              회원가입
            </Link>
          </div>

          {/* 하단 안내 */}
          <p className="text-xs text-gray-400 text-center mt-4">
            가입하고 다양한 캠페인에 참여해보세요
          </p>
        </div>
      </div>
    </>
  );
}
