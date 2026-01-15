import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, requireRole } from '@/lib/auth/middleware';
import { getCampaignById, getCampaignSpec, getCampaignApplications, getCampaignSubmissions, deleteCampaign, createEvent } from '@/lib/firebase/firestore';
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

    // 광고주 정보 가져오기
    const advertiser = await getUserById(campaign.advertiserId);
    
    const response: any = {
      id: campaign.id,
      title: campaign.title,
      status: campaign.status,
      advertiserId: campaign.advertiserId,
      advertiserName: advertiser?.displayName || advertiser?.profile?.companyName || '',
      category: (() => {
        const { normalizeCategory } = require('@/lib/utils/category');
        const rawCategory = spec?.specJson?.target_audience?.interests?.[0] || undefined;
        return rawCategory ? normalizeCategory(rawCategory) : undefined;
      })(),
      channel: spec?.specJson?.recommended_content_types?.[0]?.platform || undefined,
      description: campaign.naturalLanguageInput || spec?.proposalMarkdown || '',
      imageUrl: (campaign as any).imageUrl || undefined,
      deadline: campaign.deadlineDate?.toISOString() || undefined,
      createdAt: campaign.createdAt.toISOString(),
      updatedAt: campaign.updatedAt.toISOString(),
      spec: spec?.specJson,
      proposalMarkdown: spec?.proposalMarkdown,
      selectedInfluencerIds: campaign.selectedInfluencerIds || [],
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

/**
 * 캠페인 삭제 API
 * - 광고주: 자신의 캠페인만 삭제 가능
 * - Admin: 모든 캠페인 삭제 가능
 * - 인플루언서: 삭제 불가 (지원 취소는 별도 API 사용)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  // 광고주 또는 Admin만 삭제 가능
  const authCheck = await requireRole(['advertiser', 'admin'])(request);
  if (authCheck) return authCheck;

  const user = (request as any).user;

  try {
    const campaign = await getCampaignById(id);
    
    if (!campaign) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Campaign not found' } },
        { status: 404 }
      );
    }

    // 권한 체크: 광고주는 자신의 캠페인만 삭제 가능
    if (user.role === 'advertiser' && campaign.advertiserId !== user.uid) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You can only delete your own campaigns' } },
        { status: 403 }
      );
    }

    // 진행 중인 캠페인은 삭제 불가 (안전장치)
    if (campaign.status === 'RUNNING' || campaign.status === 'IN_PROGRESS') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Cannot delete a campaign that is in progress' } },
        { status: 400 }
      );
    }

    // 캠페인 삭제
    await deleteCampaign(id);

    // 이벤트 기록 (삭제 전에 기록)
    await createEvent({
      campaignId: id,
      actorId: user.uid,
      actorRole: user.role,
      type: 'campaign_deleted',
      payload: { deletedBy: user.uid, deletedAt: new Date().toISOString() },
    });

    // 캐시 무효화
    const { cache } = await import('@/lib/utils/cache');
    cache.deletePattern(/campaigns:/);

    return NextResponse.json({
      success: true,
      data: { campaignId: id },
    });
  } catch (error: any) {
    console.error('Delete campaign error:', error);
    const { handleApiError } = await import('@/lib/utils/errorHandler');
    return handleApiError(error);
  }
}

