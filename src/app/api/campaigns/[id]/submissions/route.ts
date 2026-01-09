import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, requireRole } from '@/lib/auth/middleware';
import { getCampaignById, getCampaignSubmissions, createSubmission, getUserById } from '@/lib/firebase/firestore';
import { getAdminFirestore } from '@/lib/firebase/admin';

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
    const campaign = await getCampaignById(id);
    
    if (!campaign) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Campaign not found' } },
        { status: 404 }
      );
    }

    // 광고주 또는 Admin만 조회 가능
    if (user.role !== 'admin' && (user.role !== 'advertiser' || campaign.advertiserId !== user.uid)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    const submissions = await getCampaignSubmissions(id);

    return NextResponse.json({
      success: true,
      data: {
        submissions: submissions.map(sub => ({
          ...sub,
          submittedAt: sub.submittedAt.toISOString(),
          updatedAt: sub.updatedAt.toISOString(),
          approvedAt: sub.approvedAt?.toISOString(),
        })),
      },
    });
  } catch (error: any) {
    console.error('Get submissions error:', error);
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
  const authCheck = await requireRole(['influencer'])(request);
  if (authCheck) return authCheck;

  const user = (request as any).user;

  try {
    const body = await request.json();
    const { postUrl, screenshotUrls, metrics, applicationId } = body;

    if (!postUrl || typeof postUrl !== 'string') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'postUrl is required' } },
        { status: 400 }
      );
    }

    const campaign = await getCampaignById(id);

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Campaign not found' } },
        { status: 404 }
      );
    }

    // 선정된 인플루언서인지 확인
    const db = getAdminFirestore();
    const appSnapshot = await db.collection('campaigns').doc(id)
      .collection('applications')
      .where('influencerId', '==', user.uid)
      .where('status', '==', 'SELECTED')
      .limit(1)
      .get();

    if (appSnapshot.empty) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You are not selected for this campaign' } },
        { status: 403 }
      );
    }

    const appId = applicationId || appSnapshot.docs[0].id;

    const submissionId = await createSubmission({
      campaignId: id,
      influencerId: user.uid,
      applicationId: appId,
      postUrl: postUrl.trim(),
      screenshotUrls: Array.isArray(screenshotUrls) ? screenshotUrls : [],
      metrics: metrics || {},
      status: 'SUBMITTED',
    });

    const { createEvent } = await import('@/lib/firebase/firestore');
    await createEvent({
      campaignId: id,
      actorId: user.uid,
      actorRole: 'influencer',
      type: 'submission_submitted',
      payload: { submissionId },
    });

    return NextResponse.json({
      success: true,
      data: {
        submissionId,
        status: 'SUBMITTED',
      },
    });
  } catch (error: any) {
    console.error('Create submission error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

