import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { getAdminFirestore } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  const user = await verifyAuth(request);
  
  // 검색은 인증 없이도 가능하도록 (선택사항)
  // 인증된 사용자는 더 많은 정보를 볼 수 있음

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query.trim()) {
      return NextResponse.json({
        success: true,
        data: {
          campaigns: [],
          advertisers: [],
          influencers: [],
        },
      });
    }

    const db = getAdminFirestore();
    const searchLower = query.toLowerCase().trim();

    // 1. 캠페인 검색
    const campaignsSnapshot = await db.collection('campaigns')
      .where('status', '==', 'OPEN')
      .limit(50) // 더 많이 가져온 후 필터링
      .get();

    const campaigns = campaignsSnapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || '',
          description: data.description || data.naturalLanguageInput || '',
          category: data.category || '',
          advertiserName: data.advertiserName || '',
          status: data.status,
          deadline: data.deadlineDate?.toDate().toISOString(),
          createdAt: data.createdAt?.toDate().toISOString(),
        };
      })
      .filter(campaign => {
        const titleMatch = campaign.title.toLowerCase().includes(searchLower);
        const descMatch = campaign.description.toLowerCase().includes(searchLower);
        const categoryMatch = campaign.category.toLowerCase().includes(searchLower);
        const advertiserMatch = campaign.advertiserName.toLowerCase().includes(searchLower);
        return titleMatch || descMatch || categoryMatch || advertiserMatch;
      })
      .slice(0, limit);

    // 2. 광고주 검색
    const advertisersSnapshot = await db.collection('users')
      .where('role', '==', 'advertiser')
      .limit(50)
      .get();

    const advertisers = advertisersSnapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          displayName: data.displayName || '',
          email: data.email || '',
          companyName: data.profile?.companyName || '',
          bio: data.profile?.bio || '',
        };
      })
      .filter(advertiser => {
        const nameMatch = advertiser.displayName.toLowerCase().includes(searchLower);
        const emailMatch = advertiser.email.toLowerCase().includes(searchLower);
        const companyMatch = advertiser.companyName.toLowerCase().includes(searchLower);
        const bioMatch = advertiser.bio.toLowerCase().includes(searchLower);
        return nameMatch || emailMatch || companyMatch || bioMatch;
      })
      .slice(0, limit);

    // 3. 인플루언서 검색
    const influencersSnapshot = await db.collection('users')
      .where('role', '==', 'influencer')
      .limit(50)
      .get();

    const influencers = influencersSnapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          displayName: data.displayName || '',
          nickname: data.profile?.nickname || '',
          email: data.email || '',
          bio: data.profile?.bio || '',
          platforms: data.profile?.platforms || [],
          followerCount: data.followerCount || 0,
        };
      })
      .filter(influencer => {
        const nameMatch = influencer.displayName.toLowerCase().includes(searchLower);
        const nicknameMatch = influencer.nickname.toLowerCase().includes(searchLower);
        const emailMatch = influencer.email.toLowerCase().includes(searchLower);
        const bioMatch = influencer.bio.toLowerCase().includes(searchLower);
        const platformMatch = influencer.platforms.some((p: string) => 
          p.toLowerCase().includes(searchLower)
        );
        return nameMatch || nicknameMatch || emailMatch || bioMatch || platformMatch;
      })
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      data: {
        campaigns,
        advertisers,
        influencers,
        total: campaigns.length + advertisers.length + influencers.length,
      },
    });
  } catch (error: any) {
    console.error('Search error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
