import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { getSurveyByUserId } from '@/lib/firebase/firestore';
import { analyzeSurveyAnswers, calculateRecommendationScore } from '@/lib/utils/surveyAnalyzer';

/**
 * 설문 결과를 기반으로 한 캠페인 추천 API
 */
export async function GET(request: NextRequest) {
  const user = await verifyAuth(request);
  
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  try {
    // 사용자의 설문 결과 가져오기
    const survey = await getSurveyByUserId(user.uid);
    
    if (!survey) {
      return NextResponse.json({
        success: true,
        data: { campaigns: [], message: '설문 결과가 없습니다.' },
      });
    }

    // 설문 결과 분석
    const analysis = analyzeSurveyAnswers(survey.answers);

    // 최신 캠페인 가져오기
    const db = getAdminFirestore();
    const campaignsSnapshot = await db.collection('campaigns')
      .where('status', '==', 'OPEN')
      .orderBy('openedAt', 'desc')
      .limit(50)
      .get();

    // 추천 점수 계산 및 정렬
    const campaignsWithScores = campaignsSnapshot.docs.map(doc => {
      const data = doc.data();
      const campaign = {
        id: doc.id,
        category: data.category,
        channel: data.spec?.recommended_content_types?.[0]?.platform,
        ...data,
      };

      const score = calculateRecommendationScore(campaign, analysis);

      return {
        campaign: {
          id: doc.id,
          title: data.title,
          description: data.naturalLanguageInput || '',
          category: data.category,
          channel: campaign.channel,
          imageUrl: data.imageUrl,
          deadline: data.deadlineDate?.toDate().toISOString(),
          createdAt: data.createdAt?.toDate().toISOString(),
        },
        score,
      };
    });

    // 점수 순으로 정렬 (높은 점수부터)
    campaignsWithScores.sort((a, b) => b.score - a.score);

    // 상위 10개만 반환
    const recommendedCampaigns = campaignsWithScores
      .slice(0, 10)
      .map(item => item.campaign);

    const response = {
      success: true,
      data: {
        campaigns: recommendedCampaigns,
        analysis,
      },
    };

    // 캐시에 저장 (10분 TTL)
    cache.set(cacheKey, response, 10 * 60 * 1000);

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Get recommended campaigns error:', error);
    const { handleApiError } = await import('@/lib/utils/errorHandler');
    return handleApiError(error);
  }
}

