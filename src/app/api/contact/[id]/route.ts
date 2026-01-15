import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import { handleApiError } from '@/lib/utils/errorHandler';

/**
 * 문의 상태 업데이트 (관리자만)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  // Admin만 수정 가능
  const authCheck = await requireRole(['admin'])(request);
  if (authCheck) return authCheck;

  try {
    const body = await request.json();
    const { status } = body;

    if (!status || !['PENDING', 'RESPONDED', 'CLOSED'].includes(status)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid status' } },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const contactRef = db.collection('contacts').doc(id);
    const contactDoc = await contactRef.get();

    if (!contactDoc.exists) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Contact not found' } },
        { status: 404 }
      );
    }

    const updateData: any = {
      status,
    };

    // RESPONDED로 변경 시 respondedAt 추가
    if (status === 'RESPONDED' && !contactDoc.data()?.respondedAt) {
      updateData.respondedAt = Timestamp.now();
    }

    await contactRef.update(updateData);

    return NextResponse.json({
      success: true,
      data: { id },
    });
  } catch (error: any) {
    return handleApiError(error, '문의 상태 업데이트에 실패했습니다.');
  }
}

