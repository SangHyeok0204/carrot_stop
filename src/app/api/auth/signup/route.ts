import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';
import { createUser } from '@/lib/firebase/firestore';
import { UserRole } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, displayName, role } = body;

    if (!email || !password || !role) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } },
        { status: 400 }
      );
    }

    if (!['advertiser', 'influencer'].includes(role)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid role' } },
        { status: 400 }
      );
    }

    const auth = getAdminAuth();
    
    // 사용자 생성
    const userRecord = await auth.createUser({
      email,
      password,
      displayName,
    });

    // Firestore에 사용자 문서 생성
    await createUser(userRecord.uid, {
      email,
      displayName,
      role: role as UserRole,
    });

    return NextResponse.json({
      success: true,
      data: {
        uid: userRecord.uid,
        email: userRecord.email,
        role,
      },
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

