'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoggedIn, isLoading: authLoading, getMyPagePath } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 이미 로그인된 경우 마이페이지로 리다이렉트
  useEffect(() => {
    if (!authLoading && isLoggedIn) {
      router.replace(getMyPagePath());
    }
  }, [authLoading, isLoggedIn, router, getMyPagePath]);

  // 이메일/비밀번호 로그인
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      // 로그인 성공 시 역할에 맞는 페이지로 이동
      // AuthContext의 onAuthStateChanged가 user를 설정하면
      // useEffect에서 리다이렉트 처리
    } catch (err: any) {
      // 에러 처리 (기존 UI 에러 영역에 표시)
      if (err.code === 'auth/user-not-found') {
        setError('가입되지 않은 이메일이에요. 회원가입을 먼저 해주세요!');
      } else if (err.code === 'auth/wrong-password') {
        setError('비밀번호가 올바르지 않아요. 다시 확인해주세요!');
      } else if (err.code === 'auth/invalid-email') {
        setError('이메일 형식이 올바르지 않아요!');
      } else if (err.code === 'auth/invalid-credential') {
        setError('이메일 또는 비밀번호가 올바르지 않아요.');
      } else {
        setError(err.message || '로그인에 실패했어요.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Google 로그인 (기능 비활성화)
  const handleGoogleLogin = async () => {
    alert('Google 로그인은 준비 중이에요! 조금만 기다려주세요 😊');
  };

  // 카카오 로그인 (준비 중)
  const handleKakaoLogin = () => {
    alert('카카오 로그인은 준비 중이에요! 조금만 기다려주세요 😊');
  };

  // 네이버 로그인 (준비 중)
  const handleNaverLogin = () => {
    alert('네이버 로그인은 준비 중이에요! 조금만 기다려주세요 😊');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-b from-purple-50 via-white to-purple-50 relative overflow-hidden">
      {/* 배경 장식 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-purple-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-violet-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-40 h-40 bg-pink-200/20 rounded-full blur-2xl" />
      </div>

      <Card className="w-full max-w-md relative z-10 border-purple-100 shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">로그인</CardTitle>
          <CardDescription>계정에 로그인하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 소셜 로그인 버튼들 */}
          <div className="space-y-3">
            {/* Google 로그인 */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 text-base"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google로 계속하기
            </Button>

            {/* 카카오 로그인 (준비 중) */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 text-base bg-yellow-300 hover:bg-yellow-400 border-yellow-400"
              onClick={handleKakaoLogin}
              disabled={loading}
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3C6.486 3 2 6.262 2 10.333c0 2.657 1.734 4.993 4.351 6.328l-.886 3.25a.3.3 0 00.438.339l3.906-2.604c.729.099 1.477.154 2.241.154 5.514 0 10-3.262 10-7.467C22 6.262 17.514 3 12 3z"/>
              </svg>
              카카오로 계속하기
            </Button>

            {/* 네이버 로그인 (준비 중) */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 text-base bg-green-500 hover:bg-green-600 text-white border-green-500"
              onClick={handleNaverLogin}
              disabled={loading}
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16.273 12.845L7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845z"/>
              </svg>
              네이버로 계속하기
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

          {/* 이메일/비밀번호 로그인 폼 */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
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
              />
            </div>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
              disabled={loading}
            >
              {loading ? '로그인 중...' : '이메일로 로그인'}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            계정이 없으신가요?{' '}
            <Link href="/auth/signup" className="text-purple-600 hover:text-purple-700 hover:underline font-medium">
              회원가입
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
