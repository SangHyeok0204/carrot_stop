'use client';

import { RoleProtectedLayout } from '@/components/layouts/RoleProtectedLayout';

export default function AdvertiserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleProtectedLayout requiredRole="advertiser">
      {children}
    </RoleProtectedLayout>
  );
}
