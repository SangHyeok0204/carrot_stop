'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'advertiser' | 'influencer'>('advertiser');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    let createdUser: any = null;

    try {
      const auth = getFirebaseAuth();
      
      // Firebase Auth에 사용자 생성
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      createdUser = userCredential.user;
      const token = await createdUser.getIdToken();

      // API로 사용자 정보 생성
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          email,
          password,
          displayName,
          role,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || '회원가입에 실패했습니다.');
      }

      // 역할에 따라 리다이렉트
      if (role === 'advertiser') {
        router.push('/advertiser/campaigns');
      } else if (role === 'influencer') {
        router.push('/influencer/campaigns');
      }
    } catch (err: any) {
      // Firebase Auth에 사용자가 생성되었지만 API 호출이 실패한 경우 롤백
      if (createdUser) {
        try {
          await deleteUser(createdUser);
        } catch (deleteErr) {
          console.error('Failed to delete user after signup failure:', deleteErr);
        }
      }

      // 에러 메시지 처리
      let errorMessage = '회원가입에 실패했습니다.';
      
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = '이미 사용 중인 이메일입니다. 로그인을 시도해보세요.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = '비밀번호가 너무 약합니다. 더 강한 비밀번호를 사용해주세요.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = '유효하지 않은 이메일 주소입니다.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>회원가입</CardTitle>
          <CardDescription>새 계정을 만드세요</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="이름"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>
            <div>
              <Input
                type="email"
                placeholder="이메일"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'advertiser' | 'influencer')}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="advertiser">광고주</option>
                <option value="influencer">인플루언서</option>
              </select>
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '가입 중...' : '회원가입'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            이미 계정이 있으신가요?{' '}
            <Link href="/auth/login" className="text-primary hover:underline">
              로그인
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

