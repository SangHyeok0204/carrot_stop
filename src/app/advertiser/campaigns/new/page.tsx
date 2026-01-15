'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TopNav } from '@/components/shared';
import { useCampaigns, Objective, Channel, BudgetRange, CampaignCategory, CreateCampaignInput } from '@/contexts';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';

// ============================================
// Form Step Types
// ============================================

type FormStep = 1 | 2 | 3;

// ============================================
// Option Button Component
// ============================================

interface OptionButtonProps {
  label: string;
  icon?: string;
  selected: boolean;
  onClick: () => void;
}

function OptionButton({ label, icon, selected, onClick }: OptionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-3 rounded-xl
        border-2 transition-all duration-200
        ${selected
          ? 'border-purple-600 bg-purple-50 text-purple-700'
          : 'border-purple-100 bg-white text-gray-700 hover:border-purple-300 hover:bg-purple-50'
        }
      `}
    >
      {icon && <span className="text-xl">{icon}</span>}
      <span className="font-medium">{label}</span>
      {selected && <span className="ml-auto text-purple-600">✓</span>}
    </button>
  );
}

// ============================================
// Step Indicator Component
// ============================================

interface StepIndicatorProps {
  currentStep: FormStep;
}

function StepIndicator({ currentStep }: StepIndicatorProps) {
  const steps = [
    { num: 1, label: '캠페인 정보' },
    { num: 2, label: '세부 설정' },
    { num: 3, label: '확인' },
  ];

  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map(({ num, label }, index) => (
        <div key={num} className="flex items-center">
          <div className={`
            flex items-center gap-2 px-4 py-2 rounded-full
            ${num === currentStep
              ? 'bg-purple-600 text-white'
              : num < currentStep
                ? 'bg-purple-100 text-purple-600'
                : 'bg-gray-100 text-gray-400'
            }
          `}>
            <span className="w-6 h-6 flex items-center justify-center rounded-full bg-white/20 text-sm font-bold">
              {num < currentStep ? '✓' : num}
            </span>
            <span className="hidden sm:inline text-sm font-medium">{label}</span>
          </div>
          {index < steps.length - 1 && (
            <div className={`w-8 h-0.5 mx-2 ${num < currentStep ? 'bg-purple-300' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================
// New Campaign Page
// ============================================

export default function NewCampaignPage() {
  const router = useRouter();
  const { addCampaign, isLoading: campaignLoading } = useCampaigns();
  const [user, setUser] = useState<{ uid: string; displayName: string | null } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [step, setStep] = useState<FormStep>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [objective, setObjective] = useState<Objective | ''>('');
  const [category, setCategory] = useState<CampaignCategory | ''>('');
  const [channel, setChannel] = useState<Channel | ''>('');
  const [budgetRange, setBudgetRange] = useState<BudgetRange | ''>('');
  const [deadline, setDeadline] = useState('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Firebase Auth 상태 확인
  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          const response = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          const data = await response.json();

          if (data.success && data.data?.role === 'advertiser') {
            setUser({
              uid: firebaseUser.uid,
              displayName: data.data.displayName || firebaseUser.displayName,
            });
          } else {
            // 광고주가 아니면 메인으로 리다이렉트
            router.push('/main');
          }
        } catch (e) {
          console.error('Auth error:', e);
          router.push('/auth/login');
        }
      } else {
        router.push('/auth/login');
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // Validation
  const isStep1Valid = title.trim() && description.trim() && objective && category;
  const isStep2Valid = channel && budgetRange && deadline;

  // Options
  const objectives: { value: Objective; label: string; icon: string }[] = [
    { value: '인지도', label: '인지도 향상', icon: '👁️' },
    { value: '방문유도', label: '웹사이트/앱 방문', icon: '🔗' },
    { value: '구매전환', label: '구매 전환', icon: '💳' },
    { value: '팔로우·구독', label: '팔로우·구독', icon: '❤️' },
  ];

  const channels: { value: Channel; label: string; icon: string }[] = [
    { value: 'Instagram', label: 'Instagram', icon: '📸' },
    { value: 'YouTube', label: 'YouTube', icon: '🎬' },
    { value: 'TikTok', label: 'TikTok', icon: '🎵' },
  ];

  const budgets: { value: BudgetRange; label: string }[] = [
    { value: '10만 미만', label: '10만원 미만' },
    { value: '10-30만', label: '10-30만원' },
    { value: '30-50만', label: '30-50만원' },
    { value: '50-100만', label: '50-100만원' },
    { value: '100만+', label: '100만원 이상' },
  ];

  const categories: { value: CampaignCategory; label: string; icon: string }[] = [
    { value: '카페', label: '카페', icon: '☕' },
    { value: '음식점', label: '음식점', icon: '🍜' },
    { value: '바/주점', label: '바/주점', icon: '🍸' },
    { value: '뷰티/미용', label: '뷰티/미용', icon: '💄' },
    { value: '패션/의류', label: '패션/의류', icon: '👗' },
    { value: '스포츠/피트니스', label: '스포츠/피트니스', icon: '🏃' },
    { value: '페스티벌/행사', label: '페스티벌/행사', icon: '🎪' },
    { value: '서포터즈', label: '서포터즈', icon: '📣' },
    { value: '리뷰/체험단', label: '리뷰/체험단', icon: '✍️' },
    { value: '기타', label: '기타', icon: '📦' },
  ];

  // Handlers
  const handleNext = () => {
    if (step < 3) setStep((prev) => (prev + 1) as FormStep);
  };

  const handleBack = () => {
    if (step > 1) setStep((prev) => (prev - 1) as FormStep);
  };

  const handleSubmit = async () => {
    if (!user || !objective || !channel || !budgetRange || !category) return;

    setIsSubmitting(true);

    try {
      const input: CreateCampaignInput = {
        title: title.trim(),
        description: description.trim(),
        objective: objective as Objective,
        channel: channel as Channel,
        budgetRange: budgetRange as BudgetRange,
        category: category as CampaignCategory,
        deadline,
        imageUrl: imageUrl || undefined,
      };

      const newCampaign = await addCampaign(input);

      if (newCampaign) {
        // 성공 → 대시보드로 이동
        router.push('/advertiser/dashboard');
      } else {
        // 실패 시 에러 처리
        alert('캠페인 등록에 실패했습니다. 다시 시도해주세요.');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Campaign creation error:', error);
      alert('캠페인 등록 중 오류가 발생했습니다.');
      setIsSubmitting(false);
    }
  };

  // 기본 마감일 설정 (2주 후)
  const getDefaultDeadline = () => {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    return date.toISOString().split('T')[0];
  };

  if (!deadline && typeof window !== 'undefined') {
    setDeadline(getDefaultDeadline());
  }

  // 로딩 중
  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-purple-50">
      <TopNav />

      <main className="pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          {/* 헤더 */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              <span className="bg-gradient-to-r from-purple-600 to-violet-500 bg-clip-text text-transparent">
                새 캠페인 만들기
              </span>
            </h1>
            <p className="text-gray-600">
              캠페인 정보를 입력하고 인플루언서를 모집하세요
            </p>
          </div>

          {/* 스텝 인디케이터 */}
          <StepIndicator currentStep={step} />

          {/* 폼 카드 */}
          <div className="bg-white rounded-3xl border border-purple-100 p-6 sm:p-8 shadow-lg">
            {/* Step 1: 기본 정보 */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    캠페인 제목 *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="예: 신제품 립스틱 체험단 모집"
                    className="
                      w-full px-4 py-3 rounded-xl
                      border border-purple-100
                      focus:border-purple-500 focus:ring-2 focus:ring-purple-200
                      outline-none transition-all
                    "
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    캠페인 설명 *
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="캠페인에 대해 자세히 설명해주세요. 브랜드 소개, 제품 특징, 원하는 콘텐츠 스타일 등..."
                    rows={4}
                    className="
                      w-full px-4 py-3 rounded-xl
                      border border-purple-100
                      focus:border-purple-500 focus:ring-2 focus:ring-purple-200
                      outline-none transition-all resize-none
                    "
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    캠페인 목적 *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {objectives.map(({ value, label, icon }) => (
                      <OptionButton
                        key={value}
                        label={label}
                        icon={icon}
                        selected={objective === value}
                        onClick={() => setObjective(value)}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    카테고리 *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {categories.map(({ value, label, icon }) => (
                      <OptionButton
                        key={value}
                        label={label}
                        icon={icon}
                        selected={category === value}
                        onClick={() => setCategory(value)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: 세부 설정 */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    채널 선택 *
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {channels.map(({ value, label, icon }) => (
                      <OptionButton
                        key={value}
                        label={label}
                        icon={icon}
                        selected={channel === value}
                        onClick={() => setChannel(value)}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    예산 범위 *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {budgets.map(({ value, label }) => (
                      <OptionButton
                        key={value}
                        label={label}
                        selected={budgetRange === value}
                        onClick={() => setBudgetRange(value)}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    모집 마감일 *
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="
                      w-full px-4 py-3 rounded-xl
                      border border-purple-100
                      focus:border-purple-500 focus:ring-2 focus:ring-purple-200
                      outline-none transition-all
                    "
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    캠페인 대표 이미지 (선택)
                  </label>
                  <div className="space-y-3">
                    {imageUrl ? (
                      <div className="relative">
                        <img
                          src={imageUrl}
                          alt="캠페인 이미지"
                          className="w-full h-48 object-cover rounded-xl border border-purple-100"
                        />
                        <button
                          type="button"
                          onClick={() => setImageUrl('')}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <label className="
                        flex flex-col items-center justify-center
                        w-full h-48 border-2 border-dashed border-purple-200
                        rounded-xl cursor-pointer
                        hover:border-purple-400 hover:bg-purple-50
                        transition-colors
                      ">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file || !user) return;

                            setIsUploadingImage(true);
                            try {
                              const auth = getFirebaseAuth();
                              const firebaseUser = auth.currentUser;
                              if (!firebaseUser) return;

                              const token = await firebaseUser.getIdToken();
                              
                              // 임시 캠페인 ID 생성 (실제 캠페인 생성 전)
                              const tempCampaignId = `temp-${Date.now()}`;
                              
                              // 업로드 URL 요청
                              const uploadResponse = await fetch('/api/storage/upload', {
                                method: 'POST',
                                headers: {
                                  'Authorization': `Bearer ${token}`,
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                  fileName: file.name,
                                  contentType: file.type,
                                  campaignId: tempCampaignId,
                                  type: 'images',
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

                              setImageUrl(uploadData.data.publicUrl);
                            } catch (error) {
                              console.error('Image upload error:', error);
                              alert('이미지 업로드에 실패했습니다.');
                            } finally {
                              setIsUploadingImage(false);
                            }
                          }}
                          disabled={isUploadingImage}
                        />
                        {isUploadingImage ? (
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                            <p className="text-sm text-gray-600">업로드 중...</p>
                          </div>
                        ) : (
                          <>
                            <svg className="w-12 h-12 text-purple-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-sm text-gray-600">이미지를 클릭하여 업로드</p>
                            <p className="text-xs text-gray-400 mt-1">JPG, PNG, GIF (최대 5MB)</p>
                          </>
                        )}
                      </label>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: 확인 */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className="text-5xl mb-4">🎉</div>
                  <h2 className="text-xl font-bold text-gray-900">캠페인 정보 확인</h2>
                  <p className="text-gray-500">아래 내용을 확인하고 캠페인을 등록하세요</p>
                </div>

                <div className="bg-purple-50 rounded-2xl p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <span className="text-gray-500">제목</span>
                    <span className="font-semibold text-gray-900 text-right max-w-[60%]">{title}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-gray-500">목적</span>
                    <span className="font-semibold text-gray-900">
                      {objectives.find(o => o.value === objective)?.icon} {objective}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">카테고리</span>
                    <span className="font-semibold text-gray-900">
                      {categories.find(c => c.value === category)?.icon} {category}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">채널</span>
                    <span className="font-semibold text-gray-900">
                      {channels.find(c => c.value === channel)?.icon} {channel}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">예산</span>
                    <span className="font-semibold text-gray-900">{budgetRange}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">마감일</span>
                    <span className="font-semibold text-gray-900">
                      {new Date(deadline).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="text-green-700 text-sm flex items-start gap-2">
                    <span>✅</span>
                    <span>
                      캠페인을 등록하면 즉시 <strong>모집중</strong> 상태로 공개되며,
                      인플루언서들이 지원할 수 있습니다.
                    </span>
                  </p>
                </div>
              </div>
            )}

            {/* 버튼 영역 */}
            <div className="flex justify-between mt-8 pt-6 border-t border-purple-100">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="
                    px-6 py-3 rounded-xl
                    text-gray-600 font-medium
                    hover:bg-gray-100
                    transition-colors
                  "
                >
                  ← 이전
                </button>
              ) : (
                <Link
                  href="/advertiser/dashboard"
                  className="
                    px-6 py-3 rounded-xl
                    text-gray-600 font-medium
                    hover:bg-gray-100
                    transition-colors
                  "
                >
                  취소
                </Link>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={step === 1 ? !isStep1Valid : !isStep2Valid}
                  className={`
                    px-6 py-3 rounded-xl font-semibold
                    transition-all duration-200
                    ${(step === 1 ? isStep1Valid : isStep2Valid)
                      ? 'bg-purple-600 text-white hover:bg-purple-700 active:scale-95'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }
                  `}
                >
                  다음 →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={`
                    px-8 py-3 rounded-xl font-semibold
                    transition-all duration-200
                    ${isSubmitting
                      ? 'bg-purple-400 text-white cursor-wait'
                      : 'bg-gradient-to-r from-purple-600 to-violet-600 text-white hover:from-purple-700 hover:to-violet-700 active:scale-95 shadow-lg shadow-purple-200'
                    }
                  `}
                >
                  {isSubmitting ? '등록 중...' : '🚀 캠페인 등록하기'}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
