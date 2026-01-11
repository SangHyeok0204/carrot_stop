import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { MainCampaign, Objective, BudgetRange, Channel } from '@/types/mainCampaign';

/**
 * 메인페이지용 최신 OPEN 캠페인 조회 API
 * - 인증 불필요 (공개 페이지)
 * - status == 'OPEN'
 * - openedAt desc 정렬
 * - limit 10
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const cursor = searchParams.get('cursor');

    const db = getAdminFirestore();

    // OPEN 상태 캠페인 조회 (인덱스 없이 동작하도록 필터만 적용 후 서버에서 정렬)
    const snapshot = await db.collection('campaigns')
      .where('status', '==', 'OPEN')
      .get();

    const now = new Date();
    const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // 각 캠페인의 spec 정보를 가져와서 MainCampaign 형식으로 매핑
    const allCampaigns = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();

        // specs 서브컬렉션에서 현재 버전의 specJson 가져오기
        let specJson: any = null;
        if (data.currentSpecVersionId) {
          const specDoc = await db.collection('campaigns')
            .doc(doc.id)
            .collection('specs')
            .doc(data.currentSpecVersionId)
            .get();
          if (specDoc.exists) {
            specJson = specDoc.data()?.specJson;
          }
        }

        // deadline 계산
        const deadlineDate = data.deadlineDate?.toDate();
        const deadline = deadlineDate
          ? deadlineDate.toISOString().split('T')[0]
          : '';

        // isHot: 마감일이 1주일 이내인지
        const isHot = deadlineDate
          ? deadlineDate <= oneWeekLater && deadlineDate >= now
          : false;

        // objective 매핑 (specJson.objective → MainCampaign.objective)
        const objective = mapObjective(specJson?.objective);

        // budgetRange 매핑 (specJson.budget_range → MainCampaign.budgetRange)
        const budgetRange = mapBudgetRange(specJson?.budget_range);

        // channel 매핑 (specJson.recommended_content_types[0].platform)
        const channel = mapChannel(specJson?.recommended_content_types);

        // 정렬용 타임스탬프 (openedAt 우선, 없으면 createdAt)
        const sortTime = data.openedAt?.toDate()?.getTime() || data.createdAt?.toDate()?.getTime() || 0;

        return {
          id: doc.id,
          title: data.title || '캠페인',
          objective,
          budgetRange,
          channel,
          deadline,
          isHot,
          _sortTime: sortTime, // 정렬용 임시 필드
        };
      })
    );

    // 최신순 정렬
    const sortedCampaigns = allCampaigns.sort((a, b) => b._sortTime - a._sortTime);
    
    // cursor가 있으면 해당 위치부터 시작
    let startIndex = 0;
    if (cursor) {
      const cursorIndex = sortedCampaigns.findIndex(c => c.id === cursor);
      if (cursorIndex >= 0) {
        startIndex = cursorIndex + 1;
      }
    }
    
    // limit 적용, _sortTime 필드 제거
    const campaigns: MainCampaign[] = sortedCampaigns
      .slice(startIndex, startIndex + limit)
      .map(({ _sortTime, ...campaign }) => campaign);
    
    // 다음 cursor 계산
    const nextCursor = campaigns.length === limit && startIndex + limit < sortedCampaigns.length
      ? campaigns[campaigns.length - 1].id
      : null;

    // 통계 계산 (전체 OPEN 캠페인 기준)
    const stats = {
      totalRecruiting: allCampaigns.length,
      deadlineThisWeek: allCampaigns.filter(c => c.isHot).length,
    };

    return NextResponse.json({
      success: true,
      data: {
        campaigns,
        stats,
        nextCursor,
      },
    });
  } catch (error: any) {
    console.error('Get latest campaigns error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

/**
 * LLM이 생성한 objective를 MainCampaign.Objective로 매핑
 */
function mapObjective(objective?: string): Objective {
  if (!objective) return '인지도';

  const lower = objective.toLowerCase();
  if (lower.includes('인지') || lower.includes('awareness')) return '인지도';
  if (lower.includes('방문') || lower.includes('traffic') || lower.includes('visit')) return '방문유도';
  if (lower.includes('구매') || lower.includes('전환') || lower.includes('conversion') || lower.includes('purchase')) return '구매전환';
  if (lower.includes('팔로') || lower.includes('구독') || lower.includes('follow') || lower.includes('subscribe')) return '팔로우·구독';

  return '인지도'; // 기본값
}

/**
 * LLM이 생성한 budget_range를 MainCampaign.BudgetRange로 매핑
 */
function mapBudgetRange(budgetRange?: { min?: number; max?: number }): BudgetRange {
  if (!budgetRange || typeof budgetRange.max !== 'number') return '10-30만';

  const maxWon = budgetRange.max;

  // 원화 기준 매핑 (만원 단위)
  if (maxWon < 100000) return '10만 미만';
  if (maxWon < 300000) return '10-30만';
  if (maxWon < 500000) return '30-50만';
  if (maxWon < 1000000) return '50-100만';
  return '100만+';
}

/**
 * LLM이 생성한 recommended_content_types를 MainCampaign.Channel로 매핑
 */
function mapChannel(contentTypes?: Array<{ platform?: string }>): Channel {
  if (!contentTypes || contentTypes.length === 0) return 'Instagram';

  const platform = contentTypes[0]?.platform?.toLowerCase() || '';

  if (platform.includes('youtube')) return 'YouTube';
  if (platform.includes('tiktok')) return 'TikTok';
  return 'Instagram'; // 기본값
}
