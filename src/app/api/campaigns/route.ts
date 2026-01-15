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
    // user.role 확인
    if (!user.role) {
      console.error('User role is undefined:', user);
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_USER', message: 'User role is not set' } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as CampaignStatus | null;
    const limit = parseInt(searchParams.get('limit') || '20');
    const cursor = searchParams.get('cursor');
    const advertiserIdParam = searchParams.get('advertiserId');

    const db = getAdminFirestore();
    let query: any = db.collection('campaigns');

    // advertiserId 쿼리 파라미터가 있으면 해당 광고주의 캠페인만 조회
    if (advertiserIdParam) {
      query = query.where('advertiserId', '==', advertiserIdParam);
    } else {
      // 역할별 필터링
      if (user.role === 'advertiser') {
        // advertiser: advertiserId로 필터링 (복합 인덱스 없이 동작하도록 orderBy 제거)
        query = query.where('advertiserId', '==', user.uid);
        // 복합 인덱스가 필요하므로 orderBy 제거하고 메모리에서 정렬
      } else if (user.role === 'influencer') {
        // influencer: 항상 OPEN 상태만 조회
        query = query.where('status', '==', 'OPEN');
        // status + orderBy 조합은 인덱스 필요 (openedAt 사용 또는 메모리 정렬)
      }
      // admin: 필터 없이 모든 캠페인 조회
    }

    // 복합 인덱스 문제를 피하기 위해 advertiserId 필터가 있거나 advertiser 역할인 경우 메모리에서 정렬
    if (advertiserIdParam || user.role === 'advertiser') {
      // orderBy 제거 (복합 인덱스 문제 회피)
      // 모든 데이터를 가져온 후 메모리에서 정렬
      // limit은 메모리 정렬 후 적용
    } else {
      // influencer/admin은 orderBy 사용
      query = query.orderBy('createdAt', 'desc').limit(limit);
    }

    if (cursor && !advertiserIdParam && user.role !== 'advertiser') {
      const cursorDoc = await db.collection('campaigns').doc(cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snapshot = await query.get();
    let campaigns = snapshot.docs.map((doc: any) => {
      const data = doc.data();
      // Firestore Timestamp를 ISO 문자열로 변환
      const convertTimestamp = (ts: any): string | undefined => {
        if (!ts) return undefined;
        if (ts instanceof Date) return ts.toISOString();
        if (ts.toDate && typeof ts.toDate === 'function') {
          try {
            return ts.toDate().toISOString();
          } catch (e) {
            return undefined;
          }
        }
        if (typeof ts === 'string') return ts;
        return undefined;
      };

      const createdAtTimestamp = data.createdAt;
      let createdAtTime = 0;
      if (createdAtTimestamp) {
        if (createdAtTimestamp.toDate && typeof createdAtTimestamp.toDate === 'function') {
          createdAtTime = createdAtTimestamp.toDate().getTime();
        } else if (createdAtTimestamp instanceof Date) {
          createdAtTime = createdAtTimestamp.getTime();
        } else if (typeof createdAtTimestamp === 'string') {
          createdAtTime = new Date(createdAtTimestamp).getTime();
        }
      }

      return {
        id: doc.id,
        ...data,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
        approvedAt: convertTimestamp(data.approvedAt),
        openedAt: convertTimestamp(data.openedAt),
        completedAt: convertTimestamp(data.completedAt),
        deadlineDate: convertTimestamp(data.deadlineDate),
        _sortTime: createdAtTime, // 정렬용 임시 필드 (TODO: Firestore 인덱스 생성 후 제거)
      };
    });

    // advertiserIdParam이 있거나 advertiser 역할인 경우 메모리에서 정렬 (복합 인덱스 문제 회피)
    if (advertiserIdParam || user.role === 'advertiser') {
      campaigns = campaigns.sort((a: any, b: any) => (b._sortTime || 0) - (a._sortTime || 0));
    }

    // status 필터를 클라이언트 측에서 적용 (복합 인덱스 문제 회피)
    if (status && (user.role === 'advertiser' || user.role === 'admin')) {
      campaigns = campaigns.filter((c: any) => c.status === status);
    }

    // limit 적용 및 _sortTime 제거
    campaigns = campaigns.slice(0, limit).map(({ _sortTime, ...c }: any) => c);

    const lastDoc = campaigns.length > 0 ? campaigns[campaigns.length - 1] : null;
    const nextCursor = lastDoc ? lastDoc.id : null;

    return NextResponse.json({
      success: true,
      data: {
        campaigns,
        nextCursor,
      },
    });
  } catch (error: any) {
    const { handleApiError } = await import('@/lib/utils/errorHandler');
    return handleApiError(error);
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
    const { naturalLanguageInput, proposal, budget, duration, channel, imageUrl, category } = body;

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

    // 이미지 URL이 있으면 캠페인 문서에 저장
    if (imageUrl) {
      await updateCampaign(campaignId, {
        imageUrl: imageUrl,
      } as any);
    }

    // 카테고리가 있으면 정규화하여 캠페인 문서에 저장
    if (category) {
      const { normalizeCategory } = await import('@/lib/utils/category');
      const normalizedCategory = normalizeCategory(category);
      await updateCampaign(campaignId, {
        category: normalizedCategory,
      } as any);
    }

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
    const { handleApiError } = await import('@/lib/utils/errorHandler');
    return handleApiError(error);
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

