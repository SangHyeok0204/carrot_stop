import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { getCampaignById, getCampaignSpec } from '@/lib/firebase/firestore';
import { CampaignStatus } from '@/types';

export async function GET(request: NextRequest) {
  const user = await verifyAuth(request);
  
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as CampaignStatus | null;
    const limit = parseInt(searchParams.get('limit') || '20');
    const cursor = searchParams.get('cursor');

    const db = getAdminFirestore();
    let query = db.collection('campaigns').orderBy('createdAt', 'desc').limit(limit);

    // 역할별 필터링
    if (user.role === 'advertiser') {
      query = query.where('advertiserId', '==', user.uid) as any;
    } else if (user.role === 'influencer') {
      query = query.where('status', '==', 'OPEN') as any;
    }
    // admin은 모든 캠페인 조회

    if (status) {
      query = query.where('status', '==', status) as any;
    }

    if (cursor) {
      const cursorDoc = await db.collection('campaigns').doc(cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc) as any;
      }
    }

    const snapshot = await query.get();
    const campaigns = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate().toISOString(),
        updatedAt: data.updatedAt?.toDate().toISOString(),
      };
    });

    const lastDoc = snapshot.docs[snapshot.docs.length - 1];
    const nextCursor = lastDoc ? lastDoc.id : null;

    return NextResponse.json({
      success: true,
      data: {
        campaigns,
        nextCursor,
      },
    });
  } catch (error: any) {
    console.error('Get campaigns error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

