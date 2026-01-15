import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { cache } from '@/lib/utils/cache';
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

    // 캐시 키 생성
    const cacheKey = `campaigns:latest:${limit}:${cursor || 'none'}`;

    // 캐시에서 먼저 확인
    const cached = cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

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

        // 광고주 정보 가져오기
        let advertiserName: string | undefined;
        if (data.advertiserId) {
          try {
            const advertiserDoc = await db.collection('users').doc(data.advertiserId).get();
            if (advertiserDoc.exists) {
              const advertiserData = advertiserDoc.data();
              advertiserName = advertiserData?.companyName || advertiserData?.displayName;
            }
          } catch (error) {
            console.error('Failed to fetch advertiser:', error);
          }
        }

        // 지원자 수 계산
        let applicationsCount = 0;
        try {
          const applicationsSnapshot = await db.collection('campaigns')
            .doc(doc.id)
            .collection('applications')
            .get();
          applicationsCount = applicationsSnapshot.size;
        } catch (error) {
          console.error('Failed to fetch applications count:', error);
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

        // 카테고리 추출 및 정규화
        const { normalizeCategory } = await import('@/lib/utils/category');
        const rawCategory = specJson?.target_audience?.interests?.[0] || data.category;
        const category = normalizeCategory(rawCategory);

        // 설명 추출 (naturalLanguageInput 또는 specJson에서)
        const description = data.naturalLanguageInput || specJson?.description || '';

        // 정렬용 타임스탬프 (openedAt 우선, 없으면 createdAt)
        const sortTime = data.openedAt?.toDate()?.getTime() || data.createdAt?.toDate()?.getTime() || 0;

        return {
          id: doc.id,
          title: data.title || '',
          objective,
          budgetRange,
          channel,
          deadline,
          isHot,
          advertiserName,
          description,
          category,
          imageUrl: data.imageUrl,
          applicationsCount,
          _sortTime: sortTime, // 정렬용 임시 필드 (TODO: Firestore 인덱스 생성 후 제거)
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

    const response = {
      success: true,
      data: {
        campaigns,
        stats,
        nextCursor,
      },
    };

    // 캐시에 저장 (5분 TTL)
    cache.set(cacheKey, response, 5 * 60 * 1000);

    return NextResponse.json(response);
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
  if (!contentTypes || contentTypes.length === 0) {
    // 기본값 대신 첫 번째 플랫폼이 없으면 첫 번째 콘텐츠 타입의 플랫폼 사용
    // 없으면 'Instagram' 반환 (하지만 실제로는 데이터가 있어야 함)
    console.warn('No content types found, defaulting to Instagram');
    return 'Instagram';
  }

  const platform = contentTypes[0]?.platform?.toLowerCase() || '';

  if (platform.includes('youtube')) return 'YouTube';
  if (platform.includes('tiktok')) return 'TikTok';
  if (platform.includes('instagram')) return 'Instagram';
  
  // 알 수 없는 플랫폼이면 기본값 반환
  console.warn(`Unknown platform: ${platform}, defaulting to Instagram`);
  return 'Instagram';
}
