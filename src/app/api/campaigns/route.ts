import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, requireRole } from '@/lib/auth/middleware';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { getCampaignById, getCampaignSpec, createCampaign, createCampaignSpec, updateCampaign } from '@/lib/firebase/firestore';
import { CampaignStatus } from '@/types';
import { Timestamp } from 'firebase-admin/firestore';

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
    const status = searchParams.get('status') as CampaignStatus | null;
    const limit = parseInt(searchParams.get('limit') || '20');
    const cursor = searchParams.get('cursor');

    const db = getAdminFirestore();
    let query = db.collection('campaigns').orderBy('createdAt', 'desc').limit(limit);

    // 역할별 필터링
    if (user.role === 'advertiser') {
      query = query.where('advertiserId', '==', user.uid) as any;
    } else if (user.role === 'influencer') {
      query = query.where('status', '==', 'OPEN') as any;
    }
    // admin은 모든 캠페인 조회

    if (status) {
      query = query.where('status', '==', status) as any;
    }

    if (cursor) {
      const cursorDoc = await db.collection('campaigns').doc(cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc) as any;
      }
    }

    const snapshot = await query.get();
    const campaigns = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate().toISOString(),
        updatedAt: data.updatedAt?.toDate().toISOString(),
      };
    });

    const lastDoc = snapshot.docs[snapshot.docs.length - 1];
    const nextCursor = lastDoc ? lastDoc.id : null;

    return NextResponse.json({
      success: true,
      data: {
        campaigns,
        nextCursor,
      },
    });
  } catch (error: any) {
    console.error('Get campaigns error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

/**
 * 캠페인 생성 (광고주 전용)
 * - 자연어 입력 + Mock 기획서 + 세부사항으로 캠페인 생성
 * - 바로 OPEN 상태로 생성
 */
export async function POST(request: NextRequest) {
  // 광고주 권한 체크
  const authCheck = await requireRole(['advertiser'])(request);
  if (authCheck) return authCheck;

  const user = (request as any).user;

  try {
    const body = await request.json();
    const { naturalLanguageInput, proposal, budget, duration, channel } = body;

    if (!naturalLanguageInput || !proposal) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: '필수 입력값이 누락되었습니다.' } },
        { status: 400 }
      );
    }

    // 캠페인 기간 계산 (duration → 일수)
    const durationDays: Record<string, number> = {
      '3days': 3,
      '1week': 7,
      '2weeks': 14,
      '1month': 30,
    };
    const days = durationDays[duration] || 14;

    const now = new Date();
    const deadlineDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    // 캠페인 문서 생성 (바로 OPEN 상태)
    const campaignId = await createCampaign({
      advertiserId: user.uid,
      status: 'OPEN',
      title: proposal.title || '새 캠페인',
      naturalLanguageInput: naturalLanguageInput.trim(),
      openedAt: Timestamp.now(),
      deadlineDate: Timestamp.fromDate(deadlineDate),
      estimatedDuration: days,
    });

    // Spec 버전 생성 (Mock 기획서 기반)
    const specJson = {
      objective: proposal.objective || '인지도',
      target_audience: {
        demographics: proposal.target || '',
      },
      tone_and_mood: [proposal.tone || ''],
      recommended_content_types: [
        {
          platform: channel || 'instagram',
          format: proposal.contentType || 'Feed Post',
        },
      ],
      schedule: {
        estimated_duration_days: days,
      },
      budget_range: {
        min: 0,
        max: parseBudget(budget),
        currency: 'KRW',
        rationale: proposal.estimatedBudget || '',
      },
      kpis: {},
      constraints: {
        must_have: proposal.coreMessages || [],
        must_not: [],
      },
      risk_flags: proposal.legalChecklist?.map((item: string) => ({
        level: 'medium',
        description: item,
      })) || [],
      clarification_questions: [],
    };

    await createCampaignSpec(campaignId, {
      proposalMarkdown: `# ${proposal.title}\n\n${naturalLanguageInput}`,
      specJson,
      createdBy: user.uid,
    });

    return NextResponse.json({
      success: true,
      data: {
        campaignId,
        status: 'OPEN',
      },
    });
  } catch (error: any) {
    console.error('Create campaign error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

/**
 * 예산 문자열을 숫자로 변환
 */
function parseBudget(budget: string): number {
  const budgetMap: Record<string, number> = {
    '<10': 100000,
    '10-30': 300000,
    '30-50': 500000,
    '50-100': 1000000,
    '100+': 2000000,
  };
  return budgetMap[budget] || 300000;
}

