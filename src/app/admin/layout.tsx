'use client';

import { RoleProtectedLayout } from '@/components/layouts/RoleProtectedLayout';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleProtectedLayout requiredRole="admin">
      {children}
    </RoleProtectedLayout>
  );
}
