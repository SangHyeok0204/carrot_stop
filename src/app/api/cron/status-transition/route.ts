import { NextRequest, NextResponse } from 'next/server';
import { verifyCronSecret } from '@/lib/auth/middleware';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { createEvent } from '@/lib/firebase/firestore';
import { Timestamp } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid cron secret' } },
      { status: 401 }
    );
  }

  try {
    const db = getAdminFirestore();
    const transitions: Array<{ campaignId: string; from: string; to: string }> = [];

    // APPROVED -> OPEN (24시간 후 자동 오픈)
    const oneDayAgo = Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000));
    const approvedSnapshot = await db.collection('campaigns')
      .where('status', '==', 'APPROVED')
      .where('approvedAt', '<=', oneDayAgo)
      .get();

    for (const doc of approvedSnapshot.docs) {
      await doc.ref.update({
        status: 'OPEN',
        openedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      transitions.push({
        campaignId: doc.id,
        from: 'APPROVED',
        to: 'OPEN',
      });

      await createEvent({
        campaignId: doc.id,
        actorId: 'system',
        actorRole: 'system',
        type: 'status_changed',
        payload: { from: 'APPROVED', to: 'OPEN' },
      });
    }

    // RUNNING -> COMPLETED (모든 제출이 승인되고 마감일 경과)
    const now = Timestamp.now();
    const runningSnapshot = await db.collection('campaigns')
      .where('status', '==', 'RUNNING')
      .where('deadlineDate', '<', now)
      .get();

    for (const doc of runningSnapshot.docs) {
      const campaignId = doc.id;
      const campaignData = doc.data();
      const selectedInfluencerIds = campaignData.selectedInfluencerIds || [];

      // 모든 인플루언서의 제출이 승인되었는지 확인
      let allApproved = true;
      for (const influencerId of selectedInfluencerIds) {
        const submissionsSnapshot = await db.collection('campaigns').doc(campaignId)
          .collection('submissions')
          .where('influencerId', '==', influencerId)
          .where('status', '==', 'APPROVED')
          .limit(1)
          .get();

        if (submissionsSnapshot.empty) {
          allApproved = false;
          break;
        }
      }

      if (allApproved && selectedInfluencerIds.length > 0) {
        await doc.ref.update({
          status: 'COMPLETED',
          completedAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });

        transitions.push({
          campaignId,
          from: 'RUNNING',
          to: 'COMPLETED',
        });

        await createEvent({
          campaignId,
          actorId: 'system',
          actorRole: 'system',
          type: 'campaign_completed',
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        transitionsCount: transitions.length,
        transitions,
      },
    });
  } catch (error: any) {
    console.error('Status transition error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

