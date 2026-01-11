import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

// 더미 캠페인 데이터
const dummyCampaigns = [
  { title: '카페 브랜드 인지도 향상 캠페인', category: '카페', objective: '인지도', budget: '10-30만', channel: 'Instagram' },
  { title: '맛집 탐방 리뷰 캠페인', category: '음식점', objective: '방문유도', budget: '30-50만', channel: 'YouTube' },
  { title: '바 분위기 홍보 캠페인', category: '바/주점', objective: '방문유도', budget: '50-100만', channel: 'Instagram' },
  { title: '뷰티 제품 체험단 모집', category: '뷰티/미용', objective: '구매전환', budget: '10-30만', channel: 'Instagram' },
  { title: '패션 브랜드 신상품 런칭', category: '패션/의류', objective: '인지도', budget: '100만+', channel: 'Instagram' },
  { title: '피트니스 센터 홍보', category: '스포츠/피트니스', objective: '방문유도', budget: '30-50만', channel: 'TikTok' },
  { title: '음악 페스티벌 홍보', category: '페스티벌/행사', objective: '인지도', budget: '100만+', channel: 'YouTube' },
  { title: '브랜드 서포터즈 모집', category: '서포터즈', objective: '팔로우·구독', budget: '50-100만', channel: 'Instagram' },
  { title: '신제품 체험단 모집', category: '리뷰/체험단', objective: '구매전환', budget: '30-50만', channel: 'YouTube' },
  { title: '카페 신메뉴 홍보', category: '카페', objective: '방문유도', budget: '10-30만', channel: 'Instagram' },
  { title: '맛집 블로그 리뷰', category: '음식점', objective: '방문유도', budget: '10-30만', channel: 'Instagram' },
  { title: '칵테일 바 홍보', category: '바/주점', objective: '인지도', budget: '30-50만', channel: 'TikTok' },
  { title: '화장품 신제품 런칭', category: '뷰티/미용', objective: '구매전환', budget: '50-100만', channel: 'Instagram' },
  { title: '의류 브랜드 협업', category: '패션/의류', objective: '인지도', budget: '100만+', channel: 'YouTube' },
  { title: '요가 스튜디오 홍보', category: '스포츠/피트니스', objective: '방문유도', budget: '30-50만', channel: 'Instagram' },
  { title: '축제 홍보 캠페인', category: '페스티벌/행사', objective: '인지도', budget: '50-100만', channel: 'TikTok' },
  { title: '브랜드 앰버서더 모집', category: '서포터즈', objective: '팔로우·구독', budget: '100만+', channel: 'YouTube' },
  { title: '제품 리뷰 체험단', category: '리뷰/체험단', objective: '구매전환', budget: '10-30만', channel: 'Instagram' },
  { title: '디저트 카페 홍보', category: '카페', objective: '방문유도', budget: '30-50만', channel: 'TikTok' },
  { title: '프리미엄 레스토랑 홍보', category: '음식점', objective: '방문유도', budget: '100만+', channel: 'YouTube' },
];

export async function POST(request: NextRequest) {
  try {
    const db = getAdminFirestore();
    const now = Timestamp.now();
    
    // 마감일 설정 (7일~30일 후 랜덤)
    const getRandomDeadline = () => {
      const days = Math.floor(Math.random() * 23) + 7; // 7~30일
      const date = new Date();
      date.setDate(date.getDate() + days);
      return Timestamp.fromDate(date);
    };

    const createdCampaigns = [];

    for (const dummy of dummyCampaigns) {
      // 캠페인 문서 생성
      const campaignRef = db.collection('campaigns').doc();
      const campaignId = campaignRef.id;
      const deadlineDate = getRandomDeadline();
      const openedAt = Timestamp.fromDate(new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)); // 최근 7일 내

      await campaignRef.set({
        advertiserId: 'dummy-advertiser-id', // 더미 광고주 ID
        status: 'OPEN',
        title: dummy.title,
        naturalLanguageInput: `${dummy.category} 관련 ${dummy.objective} 캠페인`,
        createdAt: now,
        updatedAt: now,
        deadlineDate: deadlineDate,
        openedAt: openedAt,
      });

      // Spec 생성
      const specRef = campaignRef.collection('specs').doc();
      const specJson = {
        objective: `${dummy.title}을 통한 ${dummy.objective} 달성`,
        target_audience: {
          demographics: '20-30대',
          interests: [dummy.category],
        },
        tone_and_mood: ['친근한', '트렌디한'],
        recommended_content_types: [
          {
            platform: dummy.channel.toLowerCase(),
            format: 'short_video',
            description: `${dummy.channel} 숏폼 콘텐츠`,
          },
        ],
        schedule: {
          start_date: new Date().toISOString().split('T')[0],
          end_date: deadlineDate.toDate().toISOString().split('T')[0],
        },
        budget_range: {
          min: dummy.budget === '10만 미만' ? 50000 : dummy.budget === '10-30만' ? 100000 : dummy.budget === '30-50만' ? 300000 : dummy.budget === '50-100만' ? 500000 : 1000000,
          max: dummy.budget === '10만 미만' ? 100000 : dummy.budget === '10-30만' ? 300000 : dummy.budget === '30-50만' ? 500000 : dummy.budget === '50-100만' ? 1000000 : 2000000,
        },
        kpis: {
          primary: {
            metric: 'reach',
            target: 10000,
          },
        },
        constraints: {
          must_have: [],
          must_not: [],
        },
        clarification_questions: [],
      };

      await specRef.set({
        version: 1,
        proposalMarkdown: `# ${dummy.title}\n\n${dummy.category} 분야의 ${dummy.objective}를 목표로 하는 캠페인입니다.`,
        specJson: specJson,
        createdAt: now,
        createdBy: 'dummy-advertiser-id',
      });

      // 캠페인에 현재 spec 버전 참조 추가
      await campaignRef.update({
        currentSpecVersionId: specRef.id,
      });

      createdCampaigns.push({
        id: campaignId,
        title: dummy.title,
      });
    }

    return NextResponse.json({
      success: true,
      message: `${createdCampaigns.length}개의 더미 캠페인이 생성되었습니다.`,
      data: {
        campaigns: createdCampaigns,
      },
    });
  } catch (error: any) {
    console.error('Generate dummy campaigns error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

