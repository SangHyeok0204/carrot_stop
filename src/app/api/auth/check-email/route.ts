import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';

/**
 * 이메일로 기존 계정 확인
 * Google 로그인 전에 호출하여 중복 가입 방지
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Email is required' } },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    
    // Firestore에서 이메일로 사용자 검색
    const usersSnapshot = await db.collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      // 가입되지 않은 이메일
      return NextResponse.json({
        success: true,
        data: {
          exists: false,
          methods: [],
        },
      });
    }

    // 기존 계정이 있음
    const userData = usersSnapshot.docs[0].data();
    const authProviders = userData.authProviders || ['password']; // 기본값은 이메일/비밀번호

    return NextResponse.json({
      success: true,
      data: {
        exists: true,
        methods: authProviders,
        role: userData.role,
      },
    });
  } catch (error: any) {
    console.error('Check email error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

