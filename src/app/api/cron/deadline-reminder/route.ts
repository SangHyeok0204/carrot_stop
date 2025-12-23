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
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(23, 59, 59, 999);

    // D-1인 캠페인 조회
    const snapshot = await db.collection('campaigns')
      .where('status', 'in', ['RUNNING', 'MATCHING'])
      .where('deadlineDate', '>=', Timestamp.fromDate(tomorrow))
      .where('deadlineDate', '<=', Timestamp.fromDate(tomorrowEnd))
      .get();

    const campaignIds: string[] = [];
    snapshot.forEach(doc => {
      campaignIds.push(doc.id);
    });

    // 이벤트 기록 (실제 이메일 발송은 추후 구현)
    for (const campaignId of campaignIds) {
      await createEvent({
        campaignId,
        actorId: 'system',
        actorRole: 'system',
        type: 'deadline_reminder',
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        remindedCampaigns: campaignIds.length,
        campaignIds,
      },
    });
  } catch (error: any) {
    console.error('Deadline reminder error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

