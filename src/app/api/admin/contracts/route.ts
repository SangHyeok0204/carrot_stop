import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { getCampaignById, getUserById } from '@/lib/firebase/firestore';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Admin 계약 현황 조회 API
 * - SELECTED 상태의 applications를 계약으로 간주
 * - campaign과 influencer 정보 포함
 */
export async function GET(request: NextRequest) {
  const authCheck = await requireRole(['admin'])(request);
  if (authCheck) return authCheck;

  try {
    const db = getAdminFirestore();

    // 모든 campaigns 조회
    const campaignsSnapshot = await db.collection('campaigns').get();

    const contracts: Array<{
      id: string;
      campaignId: string;
      campaign: {
        title: string;
        advertiserName: string;
      };
      influencerId: string;
      influencer: {
        displayName: string;
        email: string;
      };
      status: 'pending' | 'delayed' | 'agreed';
      selectedAt: string;
      agreedAt?: string;
    }> = [];

    // 각 campaign의 applications 서브컬렉션에서 SELECTED 상태 조회
    for (const campaignDoc of campaignsSnapshot.docs) {
      const campaignId = campaignDoc.id;
      const campaignData = campaignDoc.data();

      // SELECTED 상태의 applications 조회
      const applicationsSnapshot = await db
        .collection('campaigns')
        .doc(campaignId)
        .collection('applications')
        .where('status', '==', 'SELECTED')
        .get();

      // Campaign 정보 가져오기
      const campaign = await getCampaignById(campaignId);
      if (!campaign) continue;

      // 광고주 정보 가져오기
      let advertiserName = '알 수 없음';
      try {
        const advertiser = await getUserById(campaign.advertiserId);
        if (advertiser) {
          advertiserName = advertiser.displayName || advertiser.profile?.companyName || advertiser.email || '알 수 없음';
        }
      } catch (error) {
        console.error(`Failed to get advertiser ${campaign.advertiserId}:`, error);
      }

      // 각 application을 contract로 변환
      for (const appDoc of applicationsSnapshot.docs) {
        const appData = appDoc.data();
        const influencerId = appData.influencerId;

        // 인플루언서 정보 가져오기
        let influencerDisplayName = '알 수 없음';
        let influencerEmail = '알 수 없음';
        try {
          const influencer = await getUserById(influencerId);
          if (influencer) {
            influencerDisplayName = influencer.displayName || influencer.profile?.nickname || influencer.email || '알 수 없음';
            influencerEmail = influencer.email || '알 수 없음';
          }
        } catch (error) {
          console.error(`Failed to get influencer ${influencerId}:`, error);
        }

        // selectedAt 타임스탬프 변환
        const selectedAt = appData.selectedAt?.toDate?.()?.toISOString() || new Date().toISOString();

        // agreedAt는 submissions에서 APPROVED 상태가 있으면 그 시점 사용
        // 현재는 selectedAt 사용 (향후 submissions 체크 로직 추가 가능)
        let agreedAt: string | undefined = undefined;
        try {
          const submissionsSnapshot = await db
            .collection('campaigns')
            .doc(campaignId)
            .collection('submissions')
            .where('influencerId', '==', influencerId)
            .where('status', '==', 'APPROVED')
            .limit(1)
            .get();

          if (!submissionsSnapshot.empty) {
            const submissionData = submissionsSnapshot.docs[0].data();
            agreedAt = submissionData.approvedAt?.toDate?.()?.toISOString();
          }
        } catch (error) {
          console.error(`Failed to check submissions for ${campaignId}/${influencerId}:`, error);
        }

        // 상태 결정: agreedAt이 있으면 agreed, 마감일 지났으면 delayed, 그 외 pending
        const now = new Date();
        const deadlineDate = campaign.deadlineDate;
        let status: 'pending' | 'delayed' | 'agreed' = 'pending';

        if (agreedAt) {
          status = 'agreed';
        } else if (deadlineDate && deadlineDate < now) {
          status = 'delayed';
        } else {
          status = 'pending';
        }

        contracts.push({
          id: appDoc.id,
          campaignId,
          campaign: {
            title: campaign.title,
            advertiserName,
          },
          influencerId,
          influencer: {
            displayName: influencerDisplayName,
            email: influencerEmail,
          },
          status,
          selectedAt,
          agreedAt,
        });
      }
    }

    // selectedAt 기준 내림차순 정렬 (최신순)
    contracts.sort((a, b) => new Date(b.selectedAt).getTime() - new Date(a.selectedAt).getTime());

    return NextResponse.json({
      success: true,
      data: contracts,
    });
  } catch (error: any) {
    console.error('Get contracts error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

