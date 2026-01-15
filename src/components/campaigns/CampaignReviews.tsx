'use client';

import { useState, useEffect } from 'react';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Review {
  id: string;
  campaignId: string;
  influencerId: string;
  advertiserId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  advertiserName?: string;
}

interface CampaignReviewsProps {
  campaignId: string;
  userRole?: 'advertiser' | 'influencer' | 'admin';
  userId?: string;
  advertiserId?: string;
  influencerId?: string;
}

export function CampaignReviews({
  campaignId,
  userRole,
  userId,
  advertiserId,
  influencerId,
}: CampaignReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadReviews();
  }, [campaignId]);

  const loadReviews = async () => {
    try {
      const auth = getFirebaseAuth();
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) return;

      const token = await firebaseUser.getIdToken();
      const response = await fetch(`/api/campaigns/${campaignId}/reviews`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setReviews(data.data.reviews || []);
      }
    } catch (error) {
      console.error('Load reviews error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!userId || !userRole) return;

    setIsSubmitting(true);
    try {
      const auth = getFirebaseAuth();
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) return;

      const token = await firebaseUser.getIdToken();
      const response = await fetch(`/api/campaigns/${campaignId}/reviews`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rating, comment }),
      });

      const data = await response.json();
      if (data.success) {
        setShowReviewForm(false);
        setRating(5);
        setComment('');
        loadReviews();
      } else {
        alert('리뷰 작성에 실패했습니다.');
      }
    } catch (error) {
      console.error('Submit review error:', error);
      alert('리뷰 작성 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 리뷰 작성 가능 여부 확인
  const canWriteReview = userRole && userId && (
    (userRole === 'advertiser' && influencerId) ||
    (userRole === 'influencer' && advertiserId)
  );

  if (isLoading) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">리뷰</h3>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
        </div>
      </Card>
    );
  }

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">리뷰</h3>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-5 h-5 ${i < Math.round(averageRating) ? 'text-yellow-400' : 'text-gray-300'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {averageRating.toFixed(1)} ({reviews.length}개)
              </span>
            </div>
          )}
        </div>
        {canWriteReview && !showReviewForm && (
          <Button
            onClick={() => setShowReviewForm(true)}
            className="bg-purple-600 text-white hover:bg-purple-700"
          >
            리뷰 작성
          </Button>
        )}
      </div>

      {/* 리뷰 작성 폼 */}
      {showReviewForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">리뷰 작성</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">평점</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`w-8 h-8 ${
                      star <= rating ? 'text-yellow-400' : 'text-gray-300'
                    } hover:text-yellow-400 transition-colors`}
                  >
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-2">코멘트 (선택)</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                placeholder="리뷰를 작성해주세요..."
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleSubmitReview}
                disabled={isSubmitting}
                className="bg-purple-600 text-white hover:bg-purple-700"
              >
                {isSubmitting ? '제출 중...' : '리뷰 제출'}
              </Button>
              <Button
                onClick={() => {
                  setShowReviewForm(false);
                  setRating(5);
                  setComment('');
                }}
                variant="outline"
              >
                취소
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 리뷰 목록 */}
      {reviews.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>아직 리뷰가 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {review.advertiserName || '익명'}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(review.createdAt).toLocaleDateString('ko-KR')}
                </span>
              </div>
              {review.comment && (
                <p className="text-sm text-gray-700 mt-2">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

