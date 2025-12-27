import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, requireRole } from '@/lib/auth/middleware';
import { getAdminFirestore } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  const authCheck = await requireRole(['advertiser', 'admin'])(request);
  if (authCheck) return authCheck;

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const cursor = searchParams.get('cursor');
    const search = searchParams.get('search'); // 검색어 (이름, 이메일)
    const platform = searchParams.get('platform'); // 플랫폼 필터

    const db = getAdminFirestore();
    let query = db.collection('users')
      .where('role', '==', 'influencer')
      .orderBy('createdAt', 'desc')
      .limit(limit);

    // 플랫폼 필터 (profile.platforms 배열에 포함)
    // 주의: Firestore는 배열 필드에 대한 복합 쿼리가 제한적이므로,
    // 클라이언트 측에서 필터링하거나 별도 인덱스가 필요할 수 있습니다.
    // 일단 서버 측에서 필터링하는 방식으로 구현

    if (cursor) {
      const cursorDoc = await db.collection('users').doc(cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc) as any;
      }
    }

    const snapshot = await query.get();
    let influencers = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email,
        displayName: data.displayName,
        profile: data.profile,
        createdAt: data.createdAt?.toDate().toISOString(),
        updatedAt: data.updatedAt?.toDate().toISOString(),
      };
    });

    // 검색어 필터 (클라이언트 측)
    if (search) {
      const searchLower = search.toLowerCase();
      influencers = influencers.filter(inf => 
        inf.displayName?.toLowerCase().includes(searchLower) ||
        inf.email?.toLowerCase().includes(searchLower) ||
        inf.profile?.bio?.toLowerCase().includes(searchLower)
      );
    }

    // 플랫폼 필터 (클라이언트 측)
    if (platform) {
      influencers = influencers.filter(inf =>
        inf.profile?.platforms?.includes(platform)
      );
    }

    const lastDoc = snapshot.docs[snapshot.docs.length - 1];
    const nextCursor = lastDoc ? lastDoc.id : null;

    return NextResponse.json({
      success: true,
      data: {
        influencers,
        nextCursor,
      },
    });
  } catch (error: any) {
    console.error('Get influencers error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

