import { NextRequest, NextResponse } from 'next/server';
import { createContact } from '@/lib/firebase/firestore';
import { sendContactNotificationToAdmin, sendContactConfirmationToUser } from '@/lib/utils/email';
import { handleApiError } from '@/lib/utils/errorHandler';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Name, email, and message are required' } },
        { status: 400 }
      );
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid email format' } },
        { status: 400 }
      );
    }

    const contactId = await createContact({
      name,
      email,
      message,
      status: 'PENDING',
    });

    // 이메일 발송 (비동기, 실패해도 문의는 저장됨)
    Promise.all([
      sendContactNotificationToAdmin({ id: contactId, name, email, message }),
      sendContactConfirmationToUser({ name, email }),
    ]).catch((error) => {
      console.error('이메일 발송 실패 (문의는 저장됨):', error);
    });

    return NextResponse.json({
      success: true,
      data: { id: contactId },
      message: '문의가 접수되었습니다.',
    });
  } catch (error: any) {
    return handleApiError(error, '문의 접수에 실패했습니다.');
  }
}

/**
 * 관리자용 문의 내역 조회
 */
export async function GET(request: NextRequest) {
  try {
    const { verifyAuth, requireRole } = await import('@/lib/auth/middleware');
    
    // Admin만 조회 가능
    const authCheck = await requireRole(['admin'])(request);
    if (authCheck) return authCheck;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // PENDING, RESPONDED, CLOSED
    const limit = parseInt(searchParams.get('limit') || '50');
    const cursor = searchParams.get('cursor');

    const { getContacts } = await import('@/lib/firebase/firestore');
    const contacts = await getContacts({ status, limit, cursor });

    return NextResponse.json({
      success: true,
      data: { contacts },
    });
  } catch (error: any) {
    return handleApiError(error, '문의 내역 조회에 실패했습니다.');
  }
}

