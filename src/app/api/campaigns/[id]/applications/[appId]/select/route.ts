import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { getCampaignById, getAdminFirestore, updateCampaign, updateApplication, createEvent } from '@/lib/firebase/firestore';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; appId: string }> }
) {
  const { id, appId } = await params;
  const authCheck = await requireRole(['advertiser', 'admin'])(request);
  if (authCheck) return authCheck;

  const user = (request as any).user;

  try {
    const body = await request.json();
    const { action } = body;

    if (action !== 'select' && action !== 'reject') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid action' } },
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

    // 광고주는 자신의 캠페인만 조작 가능
    if (user.role === 'advertiser' && campaign.advertiserId !== user.uid) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    const db = getAdminFirestore();
    const appDoc = await db.collection('campaigns').doc(id)
      .collection('applications').doc(appId).get();

    if (!appDoc.exists) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Application not found' } },
        { status: 404 }
      );
    }

    const appData = appDoc.data();
    const influencerId = appData!.influencerId;

    if (action === 'select') {
      // 지원 상태를 SELECTED로 변경
      await updateApplication(id, appId, {
        status: 'SELECTED',
        selectedAt: Timestamp.now(),
      });

      // 캠페인 상태를 MATCHING에서 RUNNING으로 변경 (선택된 인플루언서가 있으면)
      if (campaign.status === 'MATCHING' || campaign.status === 'OPEN') {
        await updateCampaign(id, {
          status: 'RUNNING',
        });
      }

      // 선택된 인플루언서 목록에 추가
      const selectedIds = campaign.selectedInfluencerIds || [];
      if (!selectedIds.includes(influencerId)) {
        await updateCampaign(id, {
          selectedInfluencerIds: [...selectedIds, influencerId],
        });
      }

      await createEvent({
        campaignId: id,
        actorId: user.uid,
        actorRole: user.role,
        type: 'influencer_selected',
        payload: { applicationId: appId, influencerId },
      });

      return NextResponse.json({
        success: true,
        data: {
          applicationId: appId,
          status: 'SELECTED',
        },
      });
    } else {
      // reject
      await updateApplication(id, appId, {
        status: 'REJECTED',
      });

      await createEvent({
        campaignId: id,
        actorId: user.uid,
        actorRole: user.role,
        type: 'application_rejected',
        payload: { applicationId: appId, influencerId },
      });

      return NextResponse.json({
        success: true,
        data: {
          applicationId: appId,
          status: 'REJECTED',
        },
      });
    }
  } catch (error: any) {
    console.error('Select application error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

