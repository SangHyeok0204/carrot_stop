import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { getAdminFirestore } from '@/lib/firebase/admin';

// 특정 아이템이 찜하기 되어 있는지 확인
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
    const type = searchParams.get('type'); // 'campaigns' or 'influencers'
    const itemId = searchParams.get('itemId');
    
    if (!type || !itemId) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_PARAM', message: 'Type and itemId are required' } },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const favoritesRef = db.collection('users').doc(user.uid)
      .collection('favorites').doc(type);
    
    const favoritesDoc = await favoritesRef.get();
    
    if (!favoritesDoc.exists) {
      return NextResponse.json({
        success: true,
        data: { favorited: false },
      });
    }

    const itemIds = favoritesDoc.data()?.itemIds || [];
    const favorited = itemIds.includes(itemId);

    return NextResponse.json({
      success: true,
      data: { favorited },
    });
  } catch (error: any) {
    console.error('Check favorite error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

