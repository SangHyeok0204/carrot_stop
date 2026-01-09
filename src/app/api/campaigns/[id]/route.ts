import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { getCampaignById, getCampaignSpec, getCampaignApplications, getCampaignSubmissions } from '@/lib/firebase/firestore';
import { getUserById } from '@/lib/firebase/firestore';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await verifyAuth(request);

  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  try {
    const campaign = await getCampaignById(id);
    
    if (!campaign) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Campaign not found' } },
        { status: 404 }
      );
    }

    // 권한 체크
    if (user.role === 'advertiser' && campaign.advertiserId !== user.uid) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    if (user.role === 'influencer' && campaign.status !== 'OPEN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Campaign is not open' } },
        { status: 403 }
      );
    }

    // Spec 가져오기
    const spec = await getCampaignSpec(id);

    const response: any = {
      id: campaign.id,
      title: campaign.title,
      status: campaign.status,
      createdAt: campaign.createdAt.toISOString(),
      updatedAt: campaign.updatedAt.toISOString(),
      spec: spec?.specJson,
      proposalMarkdown: spec?.proposalMarkdown,
    };

    // 광고주 또는 Admin만 applications/submissions 조회 가능
    if ((user.role === 'advertiser' && campaign.advertiserId === user.uid) || user.role === 'admin') {
      const [applications, submissions] = await Promise.all([
        getCampaignApplications(id),
        getCampaignSubmissions(id),
      ]);

      // 인플루언서 정보 포함
      const applicationsWithUsers = await Promise.all(
        applications.map(async (app) => {
          const influencer = await getUserById(app.influencerId);
          return {
            ...app,
            influencer: influencer ? {
              displayName: influencer.displayName,
              profile: influencer.profile,
            } : null,
          };
        })
      );

      response.applications = applicationsWithUsers;
      response.submissions = submissions;
    }

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    console.error('Get campaign error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

