'use client';

import { useEffect, useCallback } from 'react';

// ============================================
// Types
// ============================================

interface LogoutModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// ============================================
// Logout Confirmation Modal
// ============================================

export function LogoutModal({ isOpen, onConfirm, onCancel }: LogoutModalProps) {
  // ESC 키로 닫기
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    },
    [onCancel]
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
      {/* 오버레이 */}
      <div
        className="fixed inset-0 bg-black/40 z-[60]"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* 모달 */}
      <div className="fixed inset-0 flex items-center justify-center z-[70] p-4">
        <div
          className="
            w-full max-w-xs
            bg-white rounded-2xl
            shadow-2xl
            p-6
            animate-in fade-in zoom-in-95 duration-200
          "
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-modal-title"
        >
          {/* 제목 */}
          <h2
            id="logout-modal-title"
            className="text-lg font-bold text-gray-900 text-center mb-2"
          >
            로그아웃 하시겠어요?
          </h2>

          {/* 본문 */}
          <p className="text-gray-500 text-center text-sm mb-6">
            다시 로그인하면 이용할 수 있어요.
          </p>

          {/* 버튼 영역 */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="
                flex-1 py-2.5 px-4
                bg-gray-100 text-gray-700
                font-medium text-sm rounded-xl
                hover:bg-gray-200
                transition-colors
              "
            >
              취소
            </button>
            <button
              onClick={onConfirm}
              className="
                flex-1 py-2.5 px-4
                bg-purple-600 text-white
                font-medium text-sm rounded-xl
                hover:bg-purple-700
                transition-colors
              "
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
