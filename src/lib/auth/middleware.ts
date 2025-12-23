import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '../firebase/admin';
import { UserRole } from '@/types';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    uid: string;
    email?: string;
    role?: UserRole;
  };
}

/**
 * API Route에서 Firebase Auth 토큰을 검증하는 미들웨어
 */
export async function verifyAuth(request: NextRequest): Promise<{
  uid: string;
  email?: string;
  role: UserRole;
} | null> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const auth = getAdminAuth();
    const decodedToken = await auth.verifyIdToken(token);
    
    // 사용자 문서에서 역할 가져오기
    const db = (await import('../firebase/admin')).getAdminFirestore();
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    
    if (!userDoc.exists) {
      return null;
    }

    const userData = userDoc.data();
    if (!userData?.role) {
      return null;
    }

    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: userData.role as UserRole,
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}

/**
 * 역할 기반 접근 제어
 */
export function requireRole(allowedRoles: UserRole[]) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const user = await verifyAuth(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    // request에 user 정보 추가 (타입 단언 필요)
    (request as AuthenticatedRequest).user = user;
    return null;
  };
}

/**
 * Cron 작업 인증
 */
export function verifyCronSecret(request: NextRequest): boolean {
  const secret = request.headers.get('x-cron-secret');
  const expectedSecret = process.env.CRON_SECRET;
  
  if (!expectedSecret) {
    console.warn('CRON_SECRET not set in environment variables');
    return false;
  }

  return secret === expectedSecret;
}

