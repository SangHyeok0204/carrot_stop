'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { googleSignIn, handleGoogleSignInRedirect, checkExistingSignInMethods, checkUserDocumentExists } from '@/lib/auth/googleAuth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect 결과 처리
  useEffect(() => {
    handleGoogleSignInRedirect().then((result) => {
      if (result) {
        if (result.success && result.user) {
          handleGoogleLoginSuccess(result.user, result.isNewUser || false);
        } else if (result.error) {
          setError(result.error.message);
        }
      }
    });
  }, []);

  // 이메일/비밀번호 로그인
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const auth = getFirebaseAuth();
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await handlePostLogin(userCredential.user);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setError('가입되지 않은 이메일이에요. 회원가입을 먼저 해주세요! 😊');
      } else if (err.code === 'auth/wrong-password') {
        setError('비밀번호가 올바르지 않아요. 다시 확인해주세요! 🔒');
      } else if (err.code === 'auth/invalid-email') {
        setError('이메일 형식이 올바르지 않아요! 📧');
      } else {
        setError(err.message || '로그인에 실패했어요 😢');
      }
    } finally {
      setLoading(false);
    }
  };

  // Google 로그인
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await googleSignIn();
      
      if (result.success && result.user) {
        await handleGoogleLoginSuccess(result.user, result.isNewUser || false);
      } else if (result.error) {
        setError(result.error.message);
      }
    } catch (err: any) {
      setError('로그인 중 문제가 발생했어요 😅');
    } finally {
      setLoading(false);
    }
  };

  // Google 로그인 성공 처리
  const handleGoogleLoginSuccess = async (user: any, isNewUser: boolean) => {
    try {
      // 🔥 중요: Firestore 문서 존재 여부로 실제 가입 완료 여부 확인
      const hasUserDocument = await checkUserDocumentExists();
      
      if (!hasUserDocument) {
        // Firestore 문서 없음 = 가입 미완료 (역할 선택 필요)
        
        // 이메일 중복 확인 (다른 방법으로 이미 가입된 경우)
        const { exists, methods } = await checkExistingSignInMethods(user.email);
        
        if (exists && !methods.includes('google.com')) {
          // 다른 방법으로 이미 가입된 이메일
          setError(
            '이 이메일은 이미 다른 방법으로 가입되어 있어요. ' +
            '기존 방법으로 로그인해주세요! 🔐'
          );
          
          // Firebase Auth에서 방금 생성된 사용자 삭제
          const auth = getFirebaseAuth();
          await auth.currentUser?.delete();
          
          return;
        }
        
        // 중복 없음 → 역할 선택 페이지로
        router.push('/auth/select-role');
      } else {
        // Firestore 문서 있음 = 이미 가입 완료 → 역할 확인 후 리다이렉트
        await handlePostLogin(user);
      }
    } catch (error) {
      console.error('Google login post-processing error:', error);
      setError('로그인 처리 중 문제가 발생했어요 😢');
    }
  };

  // 로그인 후 역할 확인 및 리다이렉트
  const handlePostLogin = async (user: any) => {
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (data.success) {
        const role = data.data.role;
        if (role === 'admin') {
          router.push('/admin/dashboard');
        } else if (role === 'advertiser') {
          router.push('/advertiser/campaigns');
        } else if (role === 'influencer') {
          router.push('/influencer/campaigns');
        }
      } else {
        // 역할이 없으면 역할 선택 페이지로
        router.push('/auth/select-role');
      }
    } catch (error) {
      console.error('Failed to fetch user role:', error);
      setError('사용자 정보를 가져오는데 실패했어요 😢');
    }
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
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-indigo-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">로그인</CardTitle>
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
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '로그인 중...' : '이메일로 로그인'}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            계정이 없으신가요?{' '}
            <Link href="/auth/signup" className="text-primary hover:underline font-medium">
              회원가입
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

