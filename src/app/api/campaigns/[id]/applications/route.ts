import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, requireRole } from '@/lib/auth/middleware';
import { getCampaignById, createApplication, getCampaignApplications, getUserById, createEvent } from '@/lib/firebase/firestore';

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

    // 광고주 또는 Admin만 조회 가능
    if (user.role !== 'admin' && (user.role !== 'advertiser' || campaign.advertiserId !== user.uid)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    const applications = await getCampaignApplications(id);
    
    // 인플루언서 정보 포함
    const applicationsWithUsers = await Promise.all(
      applications.map(async (app) => {
        const influencer = await getUserById(app.influencerId);
        return {
          id: app.id,
          campaignId: app.campaignId,
          influencerId: app.influencerId,
          influencer: influencer ? {
            displayName: influencer.displayName,
            email: influencer.email,
            profile: influencer.profile,
          } : null,
          message: app.message,
          status: app.status,
          createdAt: app.createdAt.toISOString(),
          updatedAt: app.updatedAt.toISOString(),
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        applications: applicationsWithUsers,
      },
    });
  } catch (error: any) {
    console.error('Get applications error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authCheck = await requireRole(['influencer'])(request);
  if (authCheck) return authCheck;

  const user = (request as any).user;

  try {
    const body = await request.json();
    const { message } = body;

    const campaign = await getCampaignById(id);
    
    if (!campaign) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Campaign not found' } },
        { status: 404 }
      );
    }

    if (campaign.status !== 'OPEN') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Campaign is not open for applications' } },
        { status: 400 }
      );
    }

    // 메시지에서 연락처 정보 필터링 (간단한 검사)
    const filteredMessage = message 
      ? message.replace(/[\d]{3}-[\d]{4}-[\d]{4}|@[\w]+/g, '[연락처 정보 제거됨]')
      : undefined;

    const applicationId = await createApplication({
      campaignId: id,
      influencerId: user.uid,
      message: filteredMessage,
      status: 'APPLIED',
    });

    await createEvent({
      campaignId: id,
      actorId: user.uid,
      actorRole: 'influencer',
      type: 'application_submitted',
      payload: { applicationId },
    });

    return NextResponse.json({
      success: true,
      data: {
        applicationId,
        campaignId: id,
        status: 'APPLIED',
      },
    });
  } catch (error: any) {
    console.error('Create application error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

