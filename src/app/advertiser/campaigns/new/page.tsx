'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function NewCampaignPage() {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) {
        throw new Error('로그인이 필요합니다.');
      }

      const token = await user.getIdToken();

      const response = await fetch('/api/campaigns/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          naturalLanguageInput: input,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || '캠페인 생성에 실패했습니다.');
      }

      router.push(`/advertiser/campaigns/${data.data.campaignId}/review`);
    } catch (err: any) {
      setError(err.message || '캠페인 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>새 캠페인 만들기</CardTitle>
          <CardDescription>
            광고를 몰라도 됩니다. 원하시는 느낌이나 목적을 자연어로 자유롭게 설명해주세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Textarea
                placeholder="예: 우리 회사의 새로운 헤어케어 제품을 20-30대 여성들에게 알리고 싶어요. 자연스럽고 건강한 느낌으로 소개하고 싶은데, 너무 과하지 않게요."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="min-h-[200px]"
                required
              />
              <p className="mt-2 text-sm text-muted-foreground">
                최소 10자 이상 입력해주세요.
              </p>
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading || input.trim().length < 10}>
              {loading ? '생성 중...' : '캠페인 생성하기'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

