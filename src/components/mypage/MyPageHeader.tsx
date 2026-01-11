'use client';

import { Button } from '@/components/ui/button';

// ============================================
// MyPage Header Component
// ============================================

interface MyPageHeaderProps {
  onEditClick: () => void;
}

export function MyPageHeader({ onEditClick }: MyPageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-xl font-bold text-gray-900">마이페이지</h1>
      <Button
        variant="outline"
        size="sm"
        onClick={onEditClick}
        className="text-sm"
      >
        수정하기
      </Button>
    </div>
  );
}
