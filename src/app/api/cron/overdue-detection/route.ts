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
    const now = Timestamp.now();

    // 마감일이 지났고 제출이 없는 캠페인 조회
    const snapshot = await db.collection('campaigns')
      .where('status', 'in', ['RUNNING', 'MATCHING'])
      .where('deadlineDate', '<', now)
      .get();

    const overdueCampaigns: Array<{ campaignId: string; influencerId: string }> = [];

    for (const doc of snapshot.docs) {
      const campaignId = doc.id;
      const campaignData = doc.data();
      
      // 선택된 인플루언서 확인
      const selectedInfluencerIds = campaignData.selectedInfluencerIds || [];
      
      for (const influencerId of selectedInfluencerIds) {
        // 제출 확인
        const submissionsSnapshot = await db.collection('campaigns').doc(campaignId)
          .collection('submissions')
          .where('influencerId', '==', influencerId)
          .where('status', '==', 'APPROVED')
          .limit(1)
          .get();

        if (submissionsSnapshot.empty) {
          // 제출 없음 - 페널티 기록
          overdueCampaigns.push({ campaignId, influencerId });
          
          await db.collection('penalties').add({
            campaignId,
            influencerId,
            reason: 'deadline_overdue',
            description: '마감일 초과 및 제출 미완료',
            penaltyType: 'warning',
            status: 'pending',
            createdAt: Timestamp.now(),
            appliedBy: 'system',
          });
        }
      }

      // 이벤트 기록
      await createEvent({
        campaignId,
        actorId: 'system',
        actorRole: 'system',
        type: 'deadline_overdue',
        payload: { overdueInfluencers: overdueCampaigns.filter(c => c.campaignId === campaignId).map(c => c.influencerId) },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        overdueCount: overdueCampaigns.length,
        overdueCampaigns,
      },
    });
  } catch (error: any) {
    console.error('Overdue detection error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

