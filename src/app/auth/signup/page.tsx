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
          authProvider: 'password', // 이메일/비밀번호 가입
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || '회원가입에 실패했습니다.');
      }

      // 역할에 따라 리다이렉트
      if (role === 'advertiser') {
        router.push('/advertiser/dashboard');
      } else if (role === 'influencer') {
        router.push('/influencer/feed');
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

  // Google 로그인으로 회원가입 (기능 비활성화)
  const handleGoogleSignup = () => {
    alert('Google 회원가입은 준비 중이에요! 조금만 기다려주세요 😊');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-purple-50 to-pink-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">회원가입</CardTitle>
          <CardDescription>새 계정을 만드세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 소셜 로그인 버튼들 */}
          <div className="space-y-3">
            {/* Google 회원가입 */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 text-base"
              onClick={handleGoogleSignup}
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google로 시작하기
            </Button>

            {/* 카카오 회원가입 (준비 중) */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 text-base bg-yellow-300 hover:bg-yellow-400 border-yellow-400"
              disabled
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3C6.486 3 2 6.262 2 10.333c0 2.657 1.734 4.993 4.351 6.328l-.886 3.25a.3.3 0 00.438.339l3.906-2.604c.729.099 1.477.154 2.241.154 5.514 0 10-3.262 10-7.467C22 6.262 17.514 3 12 3z"/>
              </svg>
              카카오로 시작하기 (준비 중)
            </Button>

            {/* 네이버 회원가입 (준비 중) */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 text-base bg-green-500 hover:bg-green-600 text-white border-green-500"
              disabled
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16.273 12.845L7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845z"/>
              </svg>
              네이버로 시작하기 (준비 중)
            </Button>
          </div>

          {/* 구분선 */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                또는
              </span>
            </div>
          </div>

          {/* 이메일/비밀번호 회원가입 폼 */}
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

