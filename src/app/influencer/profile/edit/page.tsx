'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TopNav } from '@/components/shared';
import { useAuth } from '@/contexts/AuthContext';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const AVAILABLE_PLATFORMS = [
  { id: 'Instagram', label: 'Instagram', icon: '📸' },
  { id: 'YouTube', label: 'YouTube', icon: '🎬' },
  { id: 'TikTok', label: 'TikTok', icon: '🎵' },
];

export default function EditProfilePage() {
  const router = useRouter();
  const { user: authUser, isLoading: authLoading, isLoggedIn } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [displayName, setDisplayName] = useState('');
  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [followerCount, setFollowerCount] = useState<number | ''>('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [instagramUrl, setInstagramUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [careerYears, setCareerYears] = useState<number | ''>('');
  const [careerMonths, setCareerMonths] = useState<number | ''>('');
  const [totalCareerYears, setTotalCareerYears] = useState<number | ''>('');
  const [availableHours, setAvailableHours] = useState('');
  const [location, setLocation] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // 인증 및 권한 확인
  useEffect(() => {
    if (!authLoading) {
      if (!isLoggedIn) {
        router.push('/auth/login');
      } else if (authUser?.role !== 'influencer') {
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
            setNickname(profile.nickname || '');
            setBio(profile.bio || '');
            setFollowerCount(profile.followerCount || '');
            setSelectedPlatforms(profile.platforms || []);
            setInstagramUrl(profile.instagramUrl || '');
            setYoutubeUrl(profile.youtubeUrl || '');
            setCareerYears(profile.careerYears || '');
            setCareerMonths(profile.careerMonths || '');
            setTotalCareerYears(profile.totalCareerYears || '');
            setAvailableHours(profile.availableHours || '');
            setLocation(profile.location || '');
            setPhotoURL(profile.photoURL || authUser.photoURL || '');
          }
        } catch (error) {
          console.error('Failed to fetch profile:', error);
          // Fallback to authUser data
          setDisplayName(authUser.displayName || '');
          setNickname(authUser.nickname || '');
          setBio(authUser.bio || '');
          setFollowerCount(authUser.followerCount || '');
          setSelectedPlatforms(authUser.profile?.platforms || []);
          setInstagramUrl(authUser.profile?.instagramUrl || '');
          setYoutubeUrl(authUser.profile?.youtubeUrl || '');
          setPhotoURL(authUser.photoURL || '');
        }
      };
      fetchProfile();
    }
  }, [authUser]);

  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

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
            nickname: nickname.trim() || undefined,
            bio: bio.trim() || undefined,
            platforms: selectedPlatforms.length > 0 ? selectedPlatforms : undefined,
            instagramUrl: instagramUrl.trim() || undefined,
            youtubeUrl: youtubeUrl.trim() || undefined,
            careerYears: careerYears !== '' ? Number(careerYears) : undefined,
            careerMonths: careerMonths !== '' ? Number(careerMonths) : undefined,
            totalCareerYears: totalCareerYears !== '' ? Number(totalCareerYears) : undefined,
            availableHours: availableHours.trim() || undefined,
            location: location.trim() || undefined,
            photoURL: photoURL.trim() || undefined,
          },
          followerCount: followerCount !== '' ? Number(followerCount) : undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        router.push('/influencer/mypage');
      } else {
        alert(data.error?.message || '프로필 업데이트에 실패했습니다.');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      alert('프로필 업데이트 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || !authUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      
      <main className="pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              뒤로가기
            </button>
            <h1 className="text-3xl font-bold text-gray-900">프로필 편집</h1>
            <p className="text-gray-600 mt-2">프로필 정보를 수정하세요</p>
          </div>

          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 프로필 사진 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  프로필 사진
                </label>
                <div className="space-y-3">
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

              {/* 이름 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이름 *
                </label>
                <Input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  placeholder="이름을 입력하세요"
                />
              </div>

              {/* 활동명 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  활동명
                </label>
                <Input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="인플루언서 활동명"
                />
              </div>

              {/* 소개 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  소개
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                  placeholder="자신을 소개해주세요"
                />
              </div>

              {/* 팔로워 수 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  팔로워 수
                </label>
                <Input
                  type="number"
                  value={followerCount}
                  onChange={(e) => setFollowerCount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="예: 10000"
                  min={0}
                />
              </div>

              {/* 활동 플랫폼 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  활동 플랫폼
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {AVAILABLE_PLATFORMS.map((platform) => (
                    <button
                      key={platform.id}
                      type="button"
                      onClick={() => handlePlatformToggle(platform.id)}
                      className={`
                        flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all
                        ${selectedPlatforms.includes(platform.id)
                          ? 'border-purple-600 bg-purple-50 text-purple-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-purple-300'
                        }
                      `}
                    >
                      <span className="text-2xl">{platform.icon}</span>
                      <span className="text-sm font-medium">{platform.label}</span>
                      {selectedPlatforms.includes(platform.id) && (
                        <span className="text-purple-600">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Instagram URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instagram URL
                </label>
                <Input
                  type="url"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  placeholder="https://instagram.com/yourhandle"
                />
              </div>

              {/* YouTube URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  YouTube URL
                </label>
                <Input
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://youtube.com/@yourchannel"
                />
              </div>

              {/* 경력사항 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    경력 년수
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={careerYears}
                    onChange={(e) => setCareerYears(e.target.value ? Number(e.target.value) : '')}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    경력 개월수
                  </label>
                  <Input
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  총 경력 (년)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={totalCareerYears}
                  onChange={(e) => setTotalCareerYears(e.target.value ? Number(e.target.value) : '')}
                  placeholder="0"
                />
              </div>

              {/* 연락 가능 시간 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  연락 가능 시간
                </label>
                <Input
                  type="text"
                  value={availableHours}
                  onChange={(e) => setAvailableHours(e.target.value)}
                  placeholder="예: 10시 ~ 20시"
                />
              </div>

              {/* 지역 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  지역
                </label>
                <Input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="예: 서울, 경기 남부"
                />
              </div>

              {/* 제출 버튼 */}
              <div className="flex items-center gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-purple-600 text-white hover:bg-purple-700"
                >
                  {isSaving ? '저장 중...' : '저장하기'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  취소
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
}

