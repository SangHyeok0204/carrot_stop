import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';

/**
 * 디버깅용: 모든 캠페인 상태 확인
 * 프로덕션에서는 제거 필요
 */
export async function GET(request: NextRequest) {
  try {
    const db = getAdminFirestore();
    const snapshot = await db.collection('campaigns').get();

    const statusCount: Record<string, number> = {};
    const campaigns = snapshot.docs.map(doc => {
      const data = doc.data();
      const status = data.status || 'undefined';
      statusCount[status] = (statusCount[status] || 0) + 1;

      return {
        id: doc.id,
        title: data.title,
        status: data.status,
        createdAt: data.createdAt?.toDate()?.toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        total: campaigns.length,
        statusCount,
        campaigns,
      },
    });
  } catch (error: any) {
    console.error('Debug campaigns error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
