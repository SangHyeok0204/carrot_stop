import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { getCampaignById, updateSubmission, createEvent } from '@/lib/firebase/firestore';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; subId: string } }
) {
  const authCheck = await requireRole(['advertiser', 'admin'])(request);
  if (authCheck) return authCheck;

  const user = (request as any).user;

  try {
    const body = await request.json();
    const { action, feedback } = body;

    if (action !== 'approve' && action !== 'needs_fix') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid action' } },
        { status: 400 }
      );
    }

    const campaign = await getCampaignById(params.id);
    
    if (!campaign) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Campaign not found' } },
        { status: 404 }
      );
    }

    // 광고주는 자신의 캠페인만 조작 가능
    if (user.role === 'advertiser' && campaign.advertiserId !== user.uid) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    const status = action === 'approve' ? 'APPROVED' : 'NEEDS_FIX';
    const updateData: any = {
      status,
    };

    if (action === 'approve') {
      updateData.approvedAt = Timestamp.now();
    } else if (feedback) {
      updateData.feedback = feedback;
    }

    await updateSubmission(params.id, params.subId, updateData);

    await createEvent({
      campaignId: params.id,
      actorId: user.uid,
      actorRole: user.role,
      type: action === 'approve' ? 'submission_approved' : 'submission_needs_fix',
      payload: { submissionId: params.subId },
    });

    return NextResponse.json({
      success: true,
      data: {
        submissionId: params.subId,
        status,
      },
    });
  } catch (error: any) {
    console.error('Review submission error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

