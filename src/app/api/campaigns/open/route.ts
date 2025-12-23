import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { getAdminFirestore } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  const authCheck = await requireRole(['influencer'])(request);
  if (authCheck) return authCheck;

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const cursor = searchParams.get('cursor');

    const db = getAdminFirestore();
    let query = db.collection('campaigns')
      .where('status', '==', 'OPEN')
      .orderBy('openedAt', 'desc')
      .limit(limit);

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
        title: data.title,
        status: data.status,
        createdAt: data.createdAt?.toDate().toISOString(),
        openedAt: data.openedAt?.toDate().toISOString(),
        deadlineDate: data.deadlineDate?.toDate().toISOString(),
        estimatedDuration: data.estimatedDuration,
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
    console.error('Get open campaigns error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

