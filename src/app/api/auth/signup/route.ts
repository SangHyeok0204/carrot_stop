import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { createUser } from '@/lib/firebase/firestore';
import { getAdminFirestore, getAdminAuth } from '@/lib/firebase/admin';
import { UserRole, AuthProvider, UserProfile } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // 인증된 사용자 확인 (클라이언트에서 이미 생성됨)
    // 회원가입 시점에는 Firestore에 사용자 문서가 아직 없으므로 requireUserDocument: false
    const user = await verifyAuth(request, { requireUserDocument: false });
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { email, displayName, role, profile, authProvider } = body;

    // 1. 필수 필드 검증
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

    // 2. 토큰의 사용자와 요청의 이메일이 일치하는지 확인
    if (user.email !== email) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Email mismatch' } },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const auth = getAdminAuth();

    // 3. uid 중복 확인 (이미 Firestore 문서가 있는지)
    const existingUserDoc = await db.collection('users').doc(user.uid).get();
    
    if (existingUserDoc.exists) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'DUPLICATE_USER', 
            message: '이미 가입된 계정이에요. 로그인 페이지로 이동해주세요! 👋' 
          } 
        },
        { status: 409 }
      );
    }

    // 4. 이메일 중복 확인 (같은 이메일로 다른 계정이 있는지)
    const emailQuery = await db.collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();
      
    if (!emailQuery.empty) {
      const existingUserData = emailQuery.docs[0].data();
      const existingProviders = existingUserData.authProviders || ['password'];
      
      // 기존 계정의 가입 방법 확인
      let providerText = '';
      if (existingProviders.includes('password')) {
        providerText = '이메일/비밀번호';
      } else if (existingProviders.includes('google.com')) {
        providerText = 'Google';
      } else if (existingProviders.includes('kakao.com')) {
        providerText = '카카오';
      } else if (existingProviders.includes('naver.com')) {
        providerText = '네이버';
      }

      // ⚠️ 중복 가입 차단 (연동 불가)
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'EMAIL_EXISTS', 
            message: `이 이메일은 이미 ${providerText}로 가입되어 있어요. 기존 방법으로 로그인해주세요! 🔐` 
          } 
        },
        { status: 409 }
      );
    }

    // 5. Firebase Auth에서 사용자 정보 가져오기 (provider 확인)
    const firebaseUser = await auth.getUser(user.uid);
    const providers: AuthProvider[] = [];
    
    firebaseUser.providerData.forEach((provider) => {
      if (provider.providerId === 'google.com') {
        providers.push('google.com');
      } else if (provider.providerId === 'password') {
        providers.push('password');
      } else if (provider.providerId === 'kakao.com') {
        providers.push('kakao.com');
      } else if (provider.providerId === 'naver.com') {
        providers.push('naver.com');
      }
    });

    // authProvider가 명시적으로 전달되면 우선 사용
    if (authProvider && !providers.includes(authProvider)) {
      providers.push(authProvider);
    }

    // 6. Firestore에 사용자 문서 생성
    const userDoc: any = {
      email,
      displayName: displayName || null, // 또는 displayName이 필수면 그냥 displayName
      role: role as UserRole,
      authProviders: providers.length > 0 ? providers : ['password'],
    };

    // profile이 "있을 때만" 필드 추가 (undefined 방지)
    if (profile) {
      userDoc.profile = profile;
    }
    if (displayName) userDoc.displayName = displayName;
    
    await createUser(user.uid, userDoc);


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

