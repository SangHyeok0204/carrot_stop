'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TopNav } from '@/components/shared';
import { useAuth } from '@/contexts/AuthContext';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function AdvertiserEditProfilePage() {
  const router = useRouter();
  const { user: authUser, isLoading: authLoading, isLoggedIn, refreshUser } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [displayName, setDisplayName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [bio, setBio] = useState('');
  const [careerYears, setCareerYears] = useState<number | ''>('');
  const [careerMonths, setCareerMonths] = useState<number | ''>('');
  const [totalCareerYears, setTotalCareerYears] = useState<number | ''>('');
  const [availableHours, setAvailableHours] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // 인증 및 권한 확인
  useEffect(() => {
    if (!authLoading) {
      if (!isLoggedIn) {
        router.push('/auth/login');
      } else if (authUser?.role !== 'advertiser') {
        router.push('/main');
      }
    }
  }, [authLoading, isLoggedIn, authUser, router]);

  // 기존 프로필 데이터 로드
  useEffect(() => {
    if (authUser) {
      const fetchProfile = async () => {
        try {
          const auth = getFirebaseAuth();
          const user = auth.currentUser;
          if (!user) return;

          const token = await user.getIdToken();
          const response = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          const data = await response.json();
          
          if (data.success && data.data) {
            const profile = data.data.profile || {};
            setDisplayName(data.data.displayName || '');
            setCompanyName(profile.companyName || '');
            setBio(profile.bio || '');
            setCareerYears(profile.careerYears || '');
            setCareerMonths(profile.careerMonths || '');
            setTotalCareerYears(profile.totalCareerYears || '');
            setAvailableHours(profile.availableHours || '');
            setPhotoURL(profile.photoURL || authUser.photoURL || '');
          }
        } catch (error) {
          console.error('Failed to fetch profile:', error);
          setPhotoURL(authUser.photoURL || '');
        }
      };
      fetchProfile();
    }
  }, [authUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser?.uid) return;

    setIsSaving(true);
    try {
      const auth = getFirebaseAuth();
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) return;

      const token = await firebaseUser.getIdToken();

      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          displayName: displayName.trim(),
          profile: {
            companyName: companyName.trim() || undefined,
            bio: bio.trim() || undefined,
            careerYears: careerYears !== '' ? Number(careerYears) : undefined,
            careerMonths: careerMonths !== '' ? Number(careerMonths) : undefined,
            totalCareerYears: totalCareerYears !== '' ? Number(totalCareerYears) : undefined,
            availableHours: availableHours.trim() || undefined,
            photoURL: photoURL.trim() || undefined,
          },
        }),
      });

      const data = await response.json();
      if (data.success) {
        await refreshUser();
        router.push('/advertiser/dashboard');
      } else {
        alert(data.error?.message || '프로필 업데이트에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('Profile update error:', error);
      alert('프로필 업데이트 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      
      <main className="pt-16">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">프로필 수정</h1>
            <p className="text-gray-500 mt-1">회사 정보와 경력 정보를 수정할 수 있습니다.</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>회사 정보</CardTitle>
              <CardDescription>회사 소개 및 기본 정보를 입력하세요.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 프로필 사진 */}
                <div>
                  <Label htmlFor="photo">프로필 사진</Label>
                  <div className="mt-2 space-y-3">
                    {photoURL ? (
                      <div className="relative inline-block">
                        <img
                          src={photoURL}
                          alt="프로필 사진"
                          className="w-32 h-32 rounded-full object-cover border-2 border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => setPhotoURL('')}
                          className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <label className="
                        flex flex-col items-center justify-center
                        w-32 h-32 border-2 border-dashed border-gray-300
                        rounded-full cursor-pointer
                        hover:border-purple-400 hover:bg-purple-50
                        transition-colors
                      ">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file || !authUser) return;

                            setIsUploadingPhoto(true);
                            try {
                              const auth = getFirebaseAuth();
                              const firebaseUser = auth.currentUser;
                              if (!firebaseUser) return;

                              const token = await firebaseUser.getIdToken();
                              
                              // 업로드 URL 요청
                              const uploadResponse = await fetch('/api/storage/upload-profile', {
                                method: 'POST',
                                headers: {
                                  'Authorization': `Bearer ${token}`,
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                  fileName: file.name,
                                  contentType: file.type,
                                }),
                              });

                              const uploadData = await uploadResponse.json();
                              if (!uploadData.success) {
                                throw new Error('Failed to get upload URL');
                              }

                              // 파일 업로드
                              const uploadResult = await fetch(uploadData.data.uploadUrl, {
                                method: 'PUT',
                                headers: {
                                  'Content-Type': file.type,
                                },
                                body: file,
                              });

                              if (!uploadResult.ok) {
                                throw new Error('Failed to upload file');
                              }

                              setPhotoURL(uploadData.data.publicUrl);
                            } catch (error) {
                              console.error('Photo upload error:', error);
                              alert('프로필 사진 업로드에 실패했습니다.');
                            } finally {
                              setIsUploadingPhoto(false);
                            }
                          }}
                          disabled={isUploadingPhoto}
                        />
                        {isUploadingPhoto ? (
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto mb-2"></div>
                            <span className="text-xs text-gray-500">업로드 중...</span>
                          </div>
                        ) : (
                          <div className="text-center">
                            <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span className="text-xs text-gray-500">사진 추가</span>
                          </div>
                        )}
                      </label>
                    )}
                  </div>
                </div>

                {/* 표시 이름 */}
                <div>
                  <Label htmlFor="displayName">표시 이름</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="이름을 입력하세요"
                    required
                  />
                </div>

                {/* 회사명 */}
                <div>
                  <Label htmlFor="companyName">회사명</Label>
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="회사명을 입력하세요"
                  />
                </div>

                {/* 회사 소개 */}
                <div>
                  <Label htmlFor="bio">회사 소개</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="회사에 대해 간단히 소개해주세요"
                    rows={5}
                  />
                </div>

                {/* 경력사항 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="careerYears">경력 년수</Label>
                    <Input
                      id="careerYears"
                      type="number"
                      min="0"
                      value={careerYears}
                      onChange={(e) => setCareerYears(e.target.value ? Number(e.target.value) : '')}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="careerMonths">경력 개월수</Label>
                    <Input
                      id="careerMonths"
                      type="number"
                      min="0"
                      max="11"
                      value={careerMonths}
                      onChange={(e) => setCareerMonths(e.target.value ? Number(e.target.value) : '')}
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* 총 경력 */}
                <div>
                  <Label htmlFor="totalCareerYears">총 경력 (년)</Label>
                  <Input
                    id="totalCareerYears"
                    type="number"
                    min="0"
                    value={totalCareerYears}
                    onChange={(e) => setTotalCareerYears(e.target.value ? Number(e.target.value) : '')}
                    placeholder="0"
                  />
                </div>

                {/* 연락 가능 시간 */}
                <div>
                  <Label htmlFor="availableHours">연락 가능 시간</Label>
                  <Input
                    id="availableHours"
                    value={availableHours}
                    onChange={(e) => setAvailableHours(e.target.value)}
                    placeholder="예: 10시 ~ 20시"
                  />
                  <p className="text-sm text-gray-500 mt-1">연락 가능한 시간대를 입력하세요.</p>
                </div>

                {/* 버튼 */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isSaving}
                  >
                    취소
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1"
                  >
                    {isSaving ? '저장 중...' : '저장하기'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
