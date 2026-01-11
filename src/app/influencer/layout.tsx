'use client';

import { RoleProtectedLayout } from '@/components/layouts/RoleProtectedLayout';

export default function InfluencerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleProtectedLayout requiredRole="influencer">
      {children}
    </RoleProtectedLayout>
  );
}
