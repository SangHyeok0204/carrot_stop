import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { getCampaignById, updateCampaign, createEvent } from '@/lib/firebase/firestore';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authCheck = await requireRole(['advertiser', 'admin'])(request);
  if (authCheck) return authCheck;

  const user = (request as any).user;

  try {
    const body = await request.json();
    const { action } = body;

    if (action !== 'approve' && action !== 'reject') {
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

    // 광고주는 자신의 캠페인만 승인 가능
    if (user.role === 'advertiser' && campaign.advertiserId !== user.uid) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    if (action === 'approve') {
      const now = Timestamp.now();
      await updateCampaign(params.id, {
        status: 'OPEN',
        approvedAt: now,
        openedAt: now,
      });

      await createEvent({
        campaignId: params.id,
        actorId: user.uid,
        actorRole: user.role,
        type: 'campaign_approved',
      });

      return NextResponse.json({
        success: true,
        data: {
          campaignId: params.id,
          status: 'OPEN',
        },
      });
    } else {
      // reject
      await updateCampaign(params.id, {
        status: 'CANCELLED',
      });

      await createEvent({
        campaignId: params.id,
        actorId: user.uid,
        actorRole: user.role,
        type: 'campaign_cancelled',
        payload: { reason: body.rejectReason },
      });

      return NextResponse.json({
        success: true,
        data: {
          campaignId: params.id,
          status: 'CANCELLED',
        },
      });
    }
  } catch (error: any) {
    console.error('Approve campaign error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

