'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft } from 'lucide-react';

interface Contract {
  id: string;
  campaignId: string;
  campaign: {
    title: string;
    advertiserName: string;
  };
  influencerId: string;
  influencer: {
    displayName: string;
    email: string;
  };
  status: 'pending' | 'delayed' | 'agreed';
  selectedAt: string;
  agreedAt?: string;
}

export default function AdminContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) return;

      const token = await user.getIdToken();

      const response = await fetch('/api/admin/contracts', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setContracts(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const pendingContracts = contracts.filter(c => c.status === 'pending');
  const delayedContracts = contracts.filter(c => c.status === 'delayed');
  const agreedContracts = contracts.filter(c => c.status === 'agreed');

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
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Back Button */}
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/admin/dashboard">
          <ArrowLeft className="mr-2 h-4 w-4" />
          대시보드로 돌아가기
        </Link>
      </Button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">계약 현황</h1>
        <p className="text-muted-foreground">
          총 {contracts.length}개의 계약 건
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">
            전체 ({contracts.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            미동의 ({pendingContracts.length})
          </TabsTrigger>
          <TabsTrigger value="delayed">
            지연 ({delayedContracts.length})
          </TabsTrigger>
          <TabsTrigger value="agreed">
            완료 ({agreedContracts.length})
          </TabsTrigger>
        </TabsList>

        {/* All Tab */}
        <TabsContent value="all" className="space-y-4">
          {contracts.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">계약 건이 없습니다</p>
              </CardContent>
            </Card>
          ) : (
            contracts.map((contract) => (
              <Card key={contract.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{contract.campaign.title}</CardTitle>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">광고주</p>
                          <p className="font-medium">{contract.campaign.advertiserName}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">인플루언서</p>
                          <p className="font-medium">{contract.influencer.displayName}</p>
                          <p className="text-xs text-muted-foreground">{contract.influencer.email}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">선정일</p>
                          <p className="font-medium">
                            {new Date(contract.selectedAt).toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                        {contract.agreedAt && (
                          <div>
                            <p className="text-muted-foreground">동의일</p>
                            <p className="font-medium">
                              {new Date(contract.agreedAt).toLocaleDateString('ko-KR')}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={contract.status} />
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Pending Tab */}
        <TabsContent value="pending" className="space-y-4">
          {pendingContracts.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">미동의 계약 건이 없습니다</p>
              </CardContent>
            </Card>
          ) : (
            pendingContracts.map((contract) => (
              <Card key={contract.id} className="border-status-pending/20 bg-status-pending/5">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{contract.campaign.title}</CardTitle>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">인플루언서</p>
                          <p className="font-medium">{contract.influencer.displayName}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">선정일</p>
                          <p className="font-medium">
                            {new Date(contract.selectedAt).toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                      </div>
                    </div>
                    <StatusBadge status="pending" />
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Delayed Tab */}
        <TabsContent value="delayed" className="space-y-4">
          {delayedContracts.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">지연된 계약 건이 없습니다</p>
              </CardContent>
            </Card>
          ) : (
            delayedContracts.map((contract) => (
              <Card key={contract.id} className="border-status-delayed/20 bg-status-delayed/5">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{contract.campaign.title}</CardTitle>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">인플루언서</p>
                          <p className="font-medium">{contract.influencer.displayName}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">선정일</p>
                          <p className="font-medium">
                            {new Date(contract.selectedAt).toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                      </div>
                    </div>
                    <StatusBadge status="delayed" />
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Agreed Tab */}
        <TabsContent value="agreed" className="space-y-4">
          {agreedContracts.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">완료된 계약 건이 없습니다</p>
              </CardContent>
            </Card>
          ) : (
            agreedContracts.map((contract) => (
              <Card key={contract.id} className="border-status-selected/20 bg-status-selected/5">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{contract.campaign.title}</CardTitle>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">인플루언서</p>
                          <p className="font-medium">{contract.influencer.displayName}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">동의일</p>
                          <p className="font-medium">
                            {contract.agreedAt && new Date(contract.agreedAt).toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                      </div>
                    </div>
                    <StatusBadge status="agreed" />
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
