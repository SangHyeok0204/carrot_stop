import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, requireRole } from '@/lib/auth/middleware';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
  const authCheck = await requireRole(['admin'])(request);
  if (authCheck) return authCheck;

  try {
    const db = getAdminFirestore();
    const now = Timestamp.now();

    // 전체 캠페인 수
    const totalCampaignsSnapshot = await db.collection('campaigns').get();
    const totalCampaigns = totalCampaignsSnapshot.size;

    // 검수 대기 (REVIEWED 또는 GENERATED 상태)
    const pendingReviewSnapshot = await db.collection('campaigns')
      .where('status', 'in', ['GENERATED', 'REVIEWED'])
      .get();
    const pendingReview = pendingReviewSnapshot.size;

    // 계약 대기 (MATCHING 상태의 캠페인)
    const pendingContractsSnapshot = await db.collection('campaigns')
      .where('status', '==', 'MATCHING')
      .get();
    const pendingContracts = pendingContractsSnapshot.size;

    // 지연 건 (RUNNING 상태이면서 마감일이 지난 캠페인)
    const delayedContractsSnapshot = await db.collection('campaigns')
      .where('status', '==', 'RUNNING')
      .where('deadlineDate', '<', now)
      .get();
    const delayedContracts = delayedContractsSnapshot.size;

    return NextResponse.json({
      success: true,
      data: {
        totalCampaigns,
        pendingReview,
        totalContracts: pendingContracts, // 임시로 pendingContracts와 동일하게 설정
        pendingContracts,
        delayedContracts,
      },
    });
  } catch (error: any) {
    console.error('Get admin stats error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

