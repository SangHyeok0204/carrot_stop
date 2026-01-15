import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { getAdminFirestore } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  const authCheck = await requireRole(['influencer'])(request);
  if (authCheck) return authCheck;

  const user = (request as any).user;

  try {
    const db = getAdminFirestore();

    // 인플루언서의 모든 지원 내역 조회
    const applicationsSnapshot = await db.collectionGroup('applications')
      .where('influencerId', '==', user.uid)
      .get();

    const applications = await Promise.all(
      applicationsSnapshot.docs.map(async (doc) => {
        const data = doc.data();
        const campaignId = doc.ref.parent.parent?.id;

        // 캠페인 정보 가져오기
        let campaign = null;
        if (campaignId) {
          const campaignDoc = await db.collection('campaigns').doc(campaignId).get();
          if (campaignDoc.exists) {
            const campaignData = campaignDoc.data();
            campaign = {
              id: campaignId,
              title: campaignData?.title || '',
              status: campaignData?.status || '',
              deadline: campaignData?.deadlineDate?.toDate().toISOString(),
            };
          }
        }

        return {
          id: doc.id,
          campaignId,
          campaign,
          status: data.status,
          message: data.message || '',
          appliedAt: data.appliedAt?.toDate().toISOString(),
          createdAt: data.createdAt?.toDate().toISOString(),
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: applications,
    });
  } catch (error: any) {
    console.error('Get applications error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
