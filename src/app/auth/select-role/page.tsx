'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserRole } from '@/types';

/**
 * 역할별 추가 정보 입력 필드 정의
 * 나중에 확장 시 이 배열에 필드를 추가하면 자동으로 UI 생성됨
 */
interface AdditionalField {
  key: string;
  label: string;
  placeholder: string;
  required: boolean;
  type?: 'text' | 'email' | 'tel' | 'number' | 'textarea';
  description?: string;
}

const ROLE_ADDITIONAL_FIELDS: Record<UserRole, AdditionalField[]> = {
  advertiser: [
    {
      key: 'companyName',
      label: '회사명',
      placeholder: '회사명을 입력해주세요',
      required: true,
      type: 'text',
      description: '광고주로 활동하실 회사명이에요',
    },
    // 나중에 추가 가능:
    // {
    //   key: 'businessNumber',
    //   label: '사업자등록번호',
    //   placeholder: '000-00-00000',
    //   required: false,
    //   type: 'text',
    // },
  ],
  influencer: [
    {
      key: 'nickname',
      label: '활동명 (닉네임)',
      placeholder: '활동하실 닉네임을 입력해주세요',
      required: true,
      type: 'text',
      description: '인플루언서로 활동하실 닉네임이에요',
    },
    // 나중에 추가 가능:
    // {
    //   key: 'platforms',
    //   label: '주요 플랫폼',
    //   placeholder: 'Instagram, YouTube 등',
    //   required: false,
    //   type: 'text',
    // },
  ],
  admin: [], // 관리자는 추가 정보 불필요
};

export default function SelectRolePage() {
  const router = useRouter();
  
  // Step 1: 역할 선택
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  
  // Step 2: 추가 정보
  const [additionalInfo, setAdditionalInfo] = useState<Record<string, string>>({});
  
  // 약관 동의
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  
  // UI 상태
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [userPhotoURL, setUserPhotoURL] = useState('');

  // 페이지 진입 시 검증
  useEffect(() => {
    const auth = getFirebaseAuth();
    const user = auth.currentUser;

    // Firebase Auth 사용자 없으면 로그인 페이지로
    if (!user) {
      router.replace('/auth/login');
      return;
    }

    // 사용자 정보 저장
    setUserEmail(user.email || '');
    setUserName(user.displayName || '');
    setUserPhotoURL(user.photoURL || '');

    // 이미 Firestore 문서가 있는지 확인
    checkUserExists(user.uid).then((exists) => {
      if (exists) {
        // 이미 가입 완료 → 대시보드로
        router.replace('/dashboard');
      }
    });

    // 세션 타임아웃 (10분)
    const timeout = setTimeout(() => {
      alert('세션이 만료되었어요. 다시 로그인해주세요! ⏰');
      signOut(auth);
      router.push('/auth/login');
    }, 10 * 60 * 1000);

    // 뒤로가기 방지
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      alert('역할을 선택해야 회원가입이 완료돼요! 😊');
      window.history.pushState(null, '', window.location.href);
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [router]);

  // 사용자 문서 존재 여부 확인
  const checkUserExists = async (uid: string): Promise<boolean> => {
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) return false;

      const token = await user.getIdToken();
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return response.ok;
    } catch {
      return false;
    }
  };

  // Step 1 → Step 2
  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setError('');
    
    // 해당 역할에 추가 정보가 필요하면 Step 2로
    const fields = ROLE_ADDITIONAL_FIELDS[role];
    if (fields.length > 0) {
      setStep(2);
    } else {
      // 추가 정보 없으면 바로 제출
      handleSubmit(role, {});
    }
  };

  // 추가 정보 입력 변경
  const handleAdditionalInfoChange = (key: string, value: string) => {
    setAdditionalInfo((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // 최종 제출
  const handleSubmit = async (role?: UserRole, info?: Record<string, string>) => {
    const finalRole = role || selectedRole;
    const finalInfo = info !== undefined ? info : additionalInfo;

    if (!finalRole) {
      setError('역할을 선택해주세요! 😊');
      return;
    }

    // 약관 동의 확인
    if (!agreedToTerms || !agreedToPrivacy) {
      setError('서비스 이용을 위해 약관에 동의해주세요! 📄');
      return;
    }

    // 필수 필드 검증
    const fields = ROLE_ADDITIONAL_FIELDS[finalRole];
    const requiredFields = fields.filter((f) => f.required);
    
    for (const field of requiredFields) {
      if (!finalInfo[field.key] || finalInfo[field.key].trim() === '') {
        setError(`${field.label}을(를) 입력해주세요! ✏️`);
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;

      if (!user) {
        throw new Error('인증 정보가 없어요. 다시 로그인해주세요!');
      }

      const token = await user.getIdToken();

      // 프로필 정보 구성
      const profile: Record<string, any> = {
        photoURL: userPhotoURL || undefined,
      };

      // 추가 정보를 profile에 병합
      Object.keys(finalInfo).forEach((key) => {
        if (finalInfo[key]) {
          profile[key] = finalInfo[key];
        }
      });

      // API 호출
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: user.email,
          displayName: userName || user.displayName,
          role: finalRole,
          profile,
          authProvider: user.providerData[0]?.providerId || 'password',
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error.message || '회원가입에 실패했어요 😢');
      }

      // 성공 → 역할별 페이지로 이동
      if (finalRole === 'advertiser') {
        router.push('/advertiser/campaigns');
      } else if (finalRole === 'influencer') {
        router.push('/influencer/campaigns');
      } else if (finalRole === 'admin') {
        router.push('/admin/dashboard');
      }
    } catch (error: any) {
      console.error('Signup error:', error);

      // 중복 가입 에러 처리
      if (error.message.includes('이미 가입') || error.message.includes('EXISTS')) {
        setError(error.message);
        setTimeout(() => {
          const auth = getFirebaseAuth();
          signOut(auth);
          router.push('/auth/login');
        }, 2000);
      } else {
        setError(error.message || '회원가입 중 문제가 발생했어요 😅');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-indigo-50">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl">
            {step === 1 ? '🎉 환영합니다!' : '📝 추가 정보'}
          </CardTitle>
          <CardDescription>
            {step === 1 
              ? 'Google 계정으로 로그인되었어요. 역할을 선택해주세요.' 
              : '거의 다 됐어요! 조금만 더 입력해주세요.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 사용자 정보 표시 */}
          {userEmail && (
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              {userPhotoURL && (
                <img 
                  src={userPhotoURL} 
                  alt="Profile" 
                  className="w-12 h-12 rounded-full"
                />
              )}
              <div>
                <p className="font-medium">{userName || '사용자'}</p>
                <p className="text-sm text-gray-500">{userEmail}</p>
              </div>
            </div>
          )}

          {/* Step 1: 역할 선택 */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-3">
                  역할을 선택해주세요 (필수) *
                </label>
                <div className="space-y-3">
                  <button
                    onClick={() => handleRoleSelect('advertiser')}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      selectedRole === 'advertiser'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    disabled={loading}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-lg">광고주 📢</p>
                        <p className="text-sm text-gray-600 mt-1">
                          캠페인을 생성하고 관리해요
                        </p>
                      </div>
                      {selectedRole === 'advertiser' && (
                        <span className="text-blue-500 text-2xl">✓</span>
                      )}
                    </div>
                  </button>

                  <button
                    onClick={() => handleRoleSelect('influencer')}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      selectedRole === 'influencer'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    disabled={loading}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-lg">인플루언서 ⭐</p>
                        <p className="text-sm text-gray-600 mt-1">
                          캠페인에 참여하고 콘텐츠를 제작해요
                        </p>
                      </div>
                      {selectedRole === 'influencer' && (
                        <span className="text-purple-500 text-2xl">✓</span>
                      )}
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: 추가 정보 입력 */}
          {step === 2 && selectedRole && (
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStep(1);
                  setAdditionalInfo({});
                }}
                className="mb-2"
              >
                ← 뒤로가기
              </Button>

              {ROLE_ADDITIONAL_FIELDS[selectedRole].map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium mb-2">
                    {field.label} {field.required && '*'}
                  </label>
                  {field.description && (
                    <p className="text-xs text-gray-500 mb-2">
                      {field.description}
                    </p>
                  )}
                  {field.type === 'textarea' ? (
                    <textarea
                      value={additionalInfo[field.key] || ''}
                      onChange={(e) => handleAdditionalInfoChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      required={field.required}
                    />
                  ) : (
                    <Input
                      type={field.type || 'text'}
                      value={additionalInfo[field.key] || ''}
                      onChange={(e) => handleAdditionalInfoChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      required={field.required}
                    />
                  )}
                </div>
              ))}

              {/* 약관 동의 */}
              <div className="space-y-3 pt-4 border-t">
                <label className="flex items-start space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1"
                  />
                  <span className="text-sm">
                    <span className="font-medium">[필수]</span> 서비스 이용약관에 동의합니다.{' '}
                    <a href="/terms" className="text-blue-600 underline" target="_blank">
                      보기
                    </a>
                  </span>
                </label>

                <label className="flex items-start space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedToPrivacy}
                    onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                    className="mt-1"
                  />
                  <span className="text-sm">
                    <span className="font-medium">[필수]</span> 개인정보 처리방침에 동의합니다.{' '}
                    <a href="/privacy" className="text-blue-600 underline" target="_blank">
                      보기
                    </a>
                  </span>
                </label>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  {error}
                </p>
              )}

              <Button
                onClick={() => handleSubmit()}
                className="w-full"
                disabled={loading || !agreedToTerms || !agreedToPrivacy}
              >
                {loading ? '가입 중...' : '가입 완료 🎉'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

