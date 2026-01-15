import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, requireRole } from '@/lib/auth/middleware';
import { createReview, getCampaignReviews } from '@/lib/firebase/firestore';
import { getCampaignById } from '@/lib/firebase/firestore';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await verifyAuth(request);

  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  try {
    const reviews = await getCampaignReviews(id);
    
    // 광고주 이름 포함
    const { getUserById } = await import('@/lib/firebase/firestore');
    const reviewsWithNames = await Promise.all(
      reviews.map(async (review) => {
        const advertiser = await getUserById(review.advertiserId);
        return {
          ...review,
          advertiserName: advertiser?.displayName || advertiser?.profile?.companyName || '익명',
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: { reviews: reviewsWithNames },
    });
  } catch (error: any) {
    console.error('Get reviews error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authCheck = await requireRole(['advertiser', 'influencer'])(request);
  if (authCheck) return authCheck;

  const user = await verifyAuth(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  try {
    const campaign = await getCampaignById(id);
    if (!campaign) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Campaign not found' } },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { rating, comment } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Rating must be between 1 and 5' } },
        { status: 400 }
      );
    }

    // 광고주는 인플루언서에게, 인플루언서는 광고주에게 리뷰 작성
    const influencerId = user.role === 'advertiser' 
      ? (campaign.selectedInfluencerIds?.[0] || '') 
      : user.uid;
    const advertiserId = user.role === 'advertiser' 
      ? user.uid 
      : campaign.advertiserId;

    const reviewId = await createReview({
      campaignId: id,
      influencerId,
      advertiserId,
      rating,
      comment,
    });

    return NextResponse.json({
      success: true,
      data: { id: reviewId },
    });
  } catch (error: any) {
    console.error('Create review error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

