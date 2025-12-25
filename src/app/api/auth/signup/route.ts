import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { createUser } from '@/lib/firebase/firestore';
import { UserRole } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // 인증된 사용자 확인 (클라이언트에서 이미 생성됨)
    const user = await verifyAuth(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { email, displayName, role } = body;

    if (!email || !role) {
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

    // 토큰의 사용자와 요청의 이메일이 일치하는지 확인
    if (user.email !== email) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Email mismatch' } },
        { status: 400 }
      );
    }

    // Firestore에 사용자 문서 생성 (이미 Auth에는 생성됨)
    await createUser(user.uid, {
      email,
      displayName: displayName || undefined,
      role: role as UserRole,
    });

    return NextResponse.json({
      success: true,
      data: {
        uid: user.uid,
        email: user.email,
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

