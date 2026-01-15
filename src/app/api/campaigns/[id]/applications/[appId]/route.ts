import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, requireRole } from '@/lib/auth/middleware';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { getCampaignById, createEvent } from '@/lib/firebase/firestore';

/**
 * 인플루언서 지원 취소 API (DELETE)
 * 인플루언서는 자신의 지원만 취소할 수 있음
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; appId: string }> }
) {
  const { id, appId } = await params;
  
  // 인플루언서만 지원 취소 가능
  const authCheck = await requireRole(['influencer'])(request);
  if (authCheck) return authCheck;

  const user = (request as any).user;

  try {
    const campaign = await getCampaignById(id);
    
    if (!campaign) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Campaign not found' } },
        { status: 404 }
      );
    }

    const db = getAdminFirestore();
    const appRef = db.collection('campaigns').doc(id)
      .collection('applications').doc(appId);
    
    const appDoc = await appRef.get();

    if (!appDoc.exists) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Application not found' } },
        { status: 404 }
      );
    }

    const appData = appDoc.data();
    
    // 자신의 지원만 취소 가능
    if (appData!.influencerId !== user.uid) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You can only cancel your own application' } },
        { status: 403 }
      );
    }

    // 이미 선정된 지원은 취소 불가
    if (appData!.status === 'SELECTED') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Cannot cancel a selected application' } },
        { status: 400 }
      );
    }

    // 지원 삭제
    await appRef.delete();

    // 이벤트 기록
    await createEvent({
      campaignId: id,
      actorId: user.uid,
      actorRole: 'influencer',
      type: 'application_cancelled',
      payload: { applicationId: appId },
    });

    return NextResponse.json({
      success: true,
      data: { applicationId: appId },
    });
  } catch (error: any) {
    console.error('Cancel application error:', error);
    const { handleApiError } = await import('@/lib/utils/errorHandler');
    return handleApiError(error);
  }
}

