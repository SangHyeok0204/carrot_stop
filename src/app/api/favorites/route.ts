import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

// 찜하기 목록 조회
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
    
    if (!type || (type !== 'campaigns' && type !== 'influencers')) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_PARAM', message: 'Type must be campaigns or influencers' } },
        { status: 400 }
      );
    }

    // 역할별 권한 체크
    if (type === 'campaigns' && user.role !== 'influencer') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only influencers can favorite campaigns' } },
        { status: 403 }
      );
    }

    if (type === 'influencers' && user.role !== 'advertiser') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only advertisers can favorite influencers' } },
        { status: 403 }
      );
    }

    const db = getAdminFirestore();
    const favoritesRef = db.collection('users').doc(user.uid)
      .collection('favorites').doc(type);
    
    const favoritesDoc = await favoritesRef.get();
    
    if (!favoritesDoc.exists) {
      return NextResponse.json({
        success: true,
        data: { items: [] },
      });
    }

    const favoritesData = favoritesDoc.data();
    const itemIds = favoritesData?.itemIds || [];

    // 실제 데이터 가져오기
    if (type === 'campaigns') {
      const campaigns = [];
      for (const campaignId of itemIds) {
        const campaignDoc = await db.collection('campaigns').doc(campaignId).get();
        if (campaignDoc.exists) {
          const data = campaignDoc.data();
          campaigns.push({
            id: campaignDoc.id,
            ...data,
            createdAt: data?.createdAt?.toDate().toISOString(),
            updatedAt: data?.updatedAt?.toDate().toISOString(),
          });
        }
      }
      return NextResponse.json({
        success: true,
        data: { items: campaigns },
      });
    } else {
      // influencers
      const influencers = [];
      for (const influencerId of itemIds) {
        const userDoc = await db.collection('users').doc(influencerId).get();
        if (userDoc.exists) {
          const data = userDoc.data();
          influencers.push({
            id: userDoc.id,
            email: data?.email,
            displayName: data?.displayName,
            profile: data?.profile,
            createdAt: data?.createdAt?.toDate().toISOString(),
          });
        }
      }
      return NextResponse.json({
        success: true,
        data: { items: influencers },
      });
    }
  } catch (error: any) {
    console.error('Get favorites error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

// 찜하기 추가/제거
export async function POST(request: NextRequest) {
  const user = await verifyAuth(request);
  
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { type, itemId, action } = body; // action: 'add' or 'remove'

    if (!type || (type !== 'campaigns' && type !== 'influencers')) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_PARAM', message: 'Type must be campaigns or influencers' } },
        { status: 400 }
      );
    }

    if (!itemId || !action) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_PARAM', message: 'itemId and action are required' } },
        { status: 400 }
      );
    }

    // 역할별 권한 체크
    if (type === 'campaigns' && user.role !== 'influencer') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only influencers can favorite campaigns' } },
        { status: 403 }
      );
    }

    if (type === 'influencers' && user.role !== 'advertiser') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only advertisers can favorite influencers' } },
        { status: 403 }
      );
    }

    // 아이템 존재 확인
    const db = getAdminFirestore();
    if (type === 'campaigns') {
      const campaignDoc = await db.collection('campaigns').doc(itemId).get();
      if (!campaignDoc.exists) {
        return NextResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: 'Campaign not found' } },
          { status: 404 }
        );
      }
    } else {
      const influencerDoc = await db.collection('users').doc(itemId).get();
      if (!influencerDoc.exists || influencerDoc.data()?.role !== 'influencer') {
        return NextResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: 'Influencer not found' } },
          { status: 404 }
        );
      }
    }

    // 찜하기 목록 업데이트
    const favoritesRef = db.collection('users').doc(user.uid)
      .collection('favorites').doc(type);
    
    const favoritesDoc = await favoritesRef.get();
    const currentItemIds = favoritesDoc.exists ? (favoritesDoc.data()?.itemIds || []) : [];

    let newItemIds: string[];
    if (action === 'add') {
      if (currentItemIds.includes(itemId)) {
        return NextResponse.json({
          success: true,
          data: { message: 'Already favorited' },
        });
      }
      newItemIds = [...currentItemIds, itemId];
    } else {
      newItemIds = currentItemIds.filter((id: string) => id !== itemId);
    }

    await favoritesRef.set({
      itemIds: newItemIds,
      updatedAt: Timestamp.now(),
    }, { merge: true });

    return NextResponse.json({
      success: true,
      data: { 
        favorited: action === 'add',
        itemIds: newItemIds,
      },
    });
  } catch (error: any) {
    console.error('Toggle favorite error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

