'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { BarChart, FileCheck, AlertCircle, CheckCircle } from 'lucide-react';

interface DashboardStats {
  totalCampaigns: number;
  pendingReview: number;
  totalContracts: number;
  pendingContracts: number;
  delayedContracts: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCampaigns: 0,
    pendingReview: 0,
    totalContracts: 0,
    pendingContracts: 0,
    delayedContracts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) return;

      const token = await user.getIdToken();

      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data || stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">운영자 대시보드</h1>
        <p className="text-muted-foreground">
          플랫폼 전체 현황을 확인할 수 있습니다
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Campaigns */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              전체 캠페인
            </CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCampaigns}</div>
            <p className="text-xs text-muted-foreground">
              총 캠페인 수
            </p>
          </CardContent>
        </Card>

        {/* Pending Review */}
        <Link href="/admin/campaigns">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-admin/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                검수 대기
              </CardTitle>
              <FileCheck className="h-4 w-4 text-admin" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-admin">{stats.pendingReview}</div>
              <p className="text-xs text-muted-foreground">
                검수가 필요한 캠페인
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Pending Contracts */}
        <Link href="/admin/contracts">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-status-pending/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                계약 대기
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-status-pending" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-status-pending">{stats.pendingContracts}</div>
              <p className="text-xs text-muted-foreground">
                인플루언서 동의 대기
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Delayed Contracts */}
        <Link href="/admin/contracts?filter=delayed">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-status-delayed/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                지연 건
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-status-delayed" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-status-delayed">{stats.delayedContracts}</div>
              <p className="text-xs text-muted-foreground">
                지연된 계약 건
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/admin/campaigns">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-admin" />
                캠페인 관리
              </CardTitle>
              <CardDescription>
                캠페인 검수 및 승인을 처리합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {stats.pendingReview}개의 검수 대기 중
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/contracts">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-admin" />
                계약 현황
              </CardTitle>
              <CardDescription>
                계약 체결 상태를 모니터링합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {stats.pendingContracts}개의 계약 대기 중
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
