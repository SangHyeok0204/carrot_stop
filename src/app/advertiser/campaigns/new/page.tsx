'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight, ChevronLeft, Check, Sparkles } from 'lucide-react';

// Mock AI 기획서 데이터 타입
interface CampaignProposal {
  title: string;
  objective: string;
  target: string;
  tone: string;
  contentType: string;
  coreMessages: string[];
  legalChecklist: string[];
  estimatedBudget: string;
  estimatedDuration: string;
  channel: string;
}

// Step 3 옵션 타입
interface CampaignDetails {
  budget: string;
  duration: string;
  channel: string;
}

export default function NewCampaignPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [input, setInput] = useState('');
  const [proposal, setProposal] = useState<CampaignProposal | null>(null);
  const [details, setDetails] = useState<CampaignDetails>({
    budget: '',
    duration: '',
    channel: 'instagram',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: 자연어 입력 제출
  const handleStep1Submit = async () => {
    setLoading(true);
    setError('');

    try {
      // MVP에서는 Mock 데이터 사용
      // 실제 AI 호출은 후순위
      await new Promise(resolve => setTimeout(resolve, 1500));

      const mockProposal: CampaignProposal = {
        title: "건강한 자연미를 담은 헤어케어 캠페인",
        objective: "인지도",
        target: "자연스러운 뷰티를 추구하는 20-30대 여성, 건강한 라이프스타일에 관심 있는 직장인",
        tone: "자연스럽고 따뜻한 톤, 신뢰감 있는 전문성",
        contentType: "Reels, Feed Post",
        coreMessages: [
          "자연 유래 성분으로 만든 건강한 헤어케어",
          "일상 속에서 쉽게 실천하는 셀프 케어",
          "지속 가능한 뷰티 루틴"
        ],
        legalChecklist: [
          "「광고 표기」 문구 필수 포함",
          "효능·효과 과대 광고 금지",
          "개인정보 수집 시 동의 절차 필요"
        ],
        estimatedBudget: "30-50만원 추천",
        estimatedDuration: "2주 권장",
        channel: "Instagram"
      };

      setProposal(mockProposal);
      setStep(2);
    } catch (err: any) {
      setError(err.message || '기획서 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 → Step 3
  const handleStep2Next = () => {
    setStep(3);
  };

  // Step 3: 최종 제출 (캠페인 오픈)
  const handleFinalSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) {
        throw new Error('로그인이 필요합니다.');
      }

      const token = await user.getIdToken();

      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          naturalLanguageInput: input,
          proposal,
          budget: details.budget,
          duration: details.duration,
          channel: details.channel,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || '캠페인 생성에 실패했습니다.');
      }

      // 캠페인 오픈 완료 후 대시보드로 이동
      router.push('/advertiser/dashboard');
    } catch (err: any) {
      setError(err.message || '캠페인 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  s === step
                    ? 'bg-advertiser text-advertiser-foreground'
                    : s < step
                    ? 'bg-advertiser/20 text-advertiser'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {s < step ? <Check className="h-4 w-4" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`h-0.5 w-12 mx-2 ${
                    s < step ? 'bg-advertiser' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-muted-foreground">
          {step === 1 && "아이디어 입력"}
          {step === 2 && "AI 기획서 확인"}
          {step === 3 && "캠페인 세부사항"}
        </p>
      </div>

      {/* Step 1: 자연어 입력 */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-advertiser" />
              캠페인 아이디어를 입력해주세요
            </CardTitle>
            <CardDescription>
              광고를 몰라도 됩니다. 원하시는 느낌이나 목적을 자연어로 자유롭게 설명해주세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Textarea
                placeholder="예: 우리 회사의 새로운 헤어케어 제품을 20-30대 여성들에게 알리고 싶어요. 자연스럽고 건강한 느낌으로 소개하고 싶은데, 너무 과하지 않게요."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="min-h-[240px] text-base"
                required
              />
              <p className="mt-2 text-sm text-muted-foreground">
                최소 10자 이상 입력해주세요.
              </p>
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button
              onClick={handleStep1Submit}
              className="w-full bg-advertiser hover:bg-advertiser/90"
              disabled={loading || input.trim().length < 10}
            >
              {loading ? '생성 중...' : (
                <>
                  다음
                  <ChevronRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: AI 기획서 결과 (카드형) */}
      {step === 2 && proposal && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>캠페인 요약</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">{proposal.title}</h3>
                <div className="inline-flex items-center rounded-full bg-advertiser/10 px-3 py-1 text-xs font-semibold text-advertiser">
                  {proposal.objective}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>타깃 & 톤</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">타깃 페르소나</p>
                <p className="text-sm">{proposal.target}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">톤 & 무드</p>
                <p className="text-sm">{proposal.tone}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>실행 가이드</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">추천 콘텐츠 타입</p>
                <p className="text-sm">{proposal.contentType}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">핵심 메시지</p>
                <ul className="space-y-2">
                  {proposal.coreMessages.map((msg, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-advertiser mt-0.5">•</span>
                      <span>{msg}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-800">
                ⚠️ 법적/운영 체크리스트
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {proposal.legalChecklist.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-yellow-900">
                    <span className="mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              className="flex-1"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              이전
            </Button>
            <Button
              onClick={handleStep2Next}
              className="flex-1 bg-advertiser hover:bg-advertiser/90"
            >
              다음
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: 3문항 확인 */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>캠페인 세부사항 확인</CardTitle>
            <CardDescription>
              예산, 기간, 채널을 최종 확정해주세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 문항 1: 예산 범위 */}
            <div className="space-y-3">
              <label className="text-sm font-semibold">예산 범위 (필수)</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { value: '<10', label: '10만원 미만' },
                  { value: '10-30', label: '10-30만원' },
                  { value: '30-50', label: '30-50만원' },
                  { value: '50-100', label: '50-100만원' },
                  { value: '100+', label: '100만원 이상' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setDetails({ ...details, budget: option.value })}
                    className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      details.budget === option.value
                        ? 'border-advertiser bg-advertiser/10 text-advertiser'
                        : 'border-border hover:border-advertiser/50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 문항 2: 캠페인 기간 */}
            <div className="space-y-3">
              <label className="text-sm font-semibold">캠페인 기간</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { value: '3days', label: '3일' },
                  { value: '1week', label: '1주' },
                  { value: '2weeks', label: '2주' },
                  { value: '1month', label: '1개월' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setDetails({ ...details, duration: option.value })}
                    className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      details.duration === option.value
                        ? 'border-advertiser bg-advertiser/10 text-advertiser'
                        : 'border-border hover:border-advertiser/50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 문항 3: 희망 채널 */}
            <div className="space-y-3">
              <label className="text-sm font-semibold">희망 채널</label>
              <p className="text-xs text-muted-foreground">
                MVP에서는 Instagram 기준으로 진행됩니다
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { value: 'instagram', label: 'Instagram', available: true },
                  { value: 'youtube', label: 'YouTube', available: false },
                  { value: 'blog', label: '블로그', available: false },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => option.available && setDetails({ ...details, channel: option.value })}
                    disabled={!option.available}
                    className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      details.channel === option.value
                        ? 'border-advertiser bg-advertiser/10 text-advertiser'
                        : option.available
                        ? 'border-border hover:border-advertiser/50'
                        : 'border-border bg-muted text-muted-foreground cursor-not-allowed'
                    }`}
                  >
                    {option.label}
                    {!option.available && <span className="ml-1 text-xs">(준비중)</span>}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="flex-1"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                이전
              </Button>
              <Button
                onClick={handleFinalSubmit}
                className="flex-1 bg-advertiser hover:bg-advertiser/90"
                disabled={loading || !details.budget || !details.duration}
              >
                {loading ? '오픈 중...' : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    캠페인 오픈
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
