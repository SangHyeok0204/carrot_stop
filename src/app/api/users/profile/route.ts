import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import { UserProfile } from '@/types/user';

export async function PUT(request: NextRequest) {
  const user = await verifyAuth(request);
  
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { displayName, profile, followerCount, nickname } = body;

    const db = getAdminFirestore();
    const userRef = db.collection('users').doc(user.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      );
    }

    const updateData: any = {
      updatedAt: Timestamp.now(),
    };

    if (displayName !== undefined) {
      updateData.displayName = displayName || null;
    }

    if (followerCount !== undefined) {
      updateData.followerCount = followerCount || null;
    }

    if (nickname !== undefined) {
      updateData.nickname = nickname || null;
    }

    // 프로필 정보 업데이트
    if (profile) {
      const existingProfile = userDoc.data()?.profile || {};
      const updatedProfile: UserProfile = {
        ...existingProfile,
        ...profile,
      };
      
      // undefined 값 제거
      Object.keys(updatedProfile).forEach(key => {
        if (updatedProfile[key as keyof UserProfile] === undefined) {
          delete updatedProfile[key as keyof UserProfile];
        }
      });

      updateData.profile = updatedProfile;
    }

    await userRef.update(updateData);

    return NextResponse.json({
      success: true,
      data: { uid: user.uid },
    });
  } catch (error: any) {
    const { handleApiError } = await import('@/lib/utils/errorHandler');
    return handleApiError(error);
  }
}

