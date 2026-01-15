import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, requireRole } from '@/lib/auth/middleware';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { getCampaignById } from '@/lib/firebase/firestore';
import { CampaignStatus } from '@/types';
import { timestampToDate } from '@/lib/firebase/firestore';

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

  // 본인 또는 admin만 조회 가능
  if (user.uid !== id && user.role !== 'admin') {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as CampaignStatus | null;

    const db = getAdminFirestore();
    
    // 해당 인플루언서가 지원한 모든 캠페인의 applications 조회
    const campaignsRef = db.collection('campaigns');
    const allCampaignsSnapshot = await campaignsRef.get();
    
    const influencerCampaigns: Array<{
      campaign: any;
      application: any;
      status: 'applied' | 'selected' | 'running' | 'completed';
    }> = [];

    // 각 캠페인에서 해당 인플루언서의 application 찾기
    for (const campaignDoc of allCampaignsSnapshot.docs) {
      const campaignId = campaignDoc.id;
      const applicationsSnapshot = await campaignsRef
        .doc(campaignId)
        .collection('applications')
        .where('influencerId', '==', id)
        .get();

      if (!applicationsSnapshot.empty) {
        const applicationDoc = applicationsSnapshot.docs[0];
        const applicationData = applicationDoc.data();
        const campaignData = campaignDoc.data();
        
        // 상태 매핑
        let campaignStatus: 'applied' | 'selected' | 'running' | 'completed' = 'applied';
        if (applicationData.status === 'SELECTED') {
          if (campaignData.status === 'RUNNING') {
            campaignStatus = 'running';
          } else if (campaignData.status === 'COMPLETED') {
            campaignStatus = 'completed';
          } else {
            campaignStatus = 'selected';
          }
        }

        // 상태 필터링
        if (status) {
          const statusMap: Record<string, CampaignStatus> = {
            'applied': 'OPEN',
            'selected': 'MATCHING',
            'running': 'RUNNING',
            'completed': 'COMPLETED',
          };
          if (statusMap[campaignStatus] !== campaignData.status) {
            continue;
          }
        }

        influencerCampaigns.push({
          campaign: {
            id: campaignId,
            title: campaignData.title,
            status: campaignData.status,
            advertiserId: campaignData.advertiserId,
            createdAt: timestampToDate(campaignData.createdAt)?.toISOString(),
            openedAt: timestampToDate(campaignData.openedAt)?.toISOString(),
            deadlineDate: timestampToDate(campaignData.deadlineDate)?.toISOString(),
            estimatedDuration: campaignData.estimatedDuration,
          },
          application: {
            id: applicationDoc.id,
            message: applicationData.message,
            status: applicationData.status,
            createdAt: timestampToDate(applicationData.createdAt)?.toISOString(),
            selectedAt: timestampToDate(applicationData.selectedAt)?.toISOString(),
          },
          status: campaignStatus,
        });
      }
    }

    // 상태별로 그룹화
    const grouped = {
      applied: influencerCampaigns.filter(c => c.status === 'applied'),
      selected: influencerCampaigns.filter(c => c.status === 'selected'),
      running: influencerCampaigns.filter(c => c.status === 'running'),
      completed: influencerCampaigns.filter(c => c.status === 'completed'),
    };

    // applications 배열 생성 (campaignId -> applicationId 매핑용)
    const applications = influencerCampaigns.map(item => ({
      id: item.application.id,
      campaignId: item.campaign.id,
      influencerId: id,
      status: item.application.status,
      createdAt: item.application.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        campaigns: influencerCampaigns.map(item => ({
          ...item.campaign,
          // Campaign 타입에 맞게 변환
          objective: undefined,
          budgetRange: undefined,
          channel: undefined,
          deadline: item.campaign.deadlineDate,
          description: undefined,
          category: undefined,
          imageUrl: undefined,
          applicationsCount: undefined,
        })),
        grouped: {
          applied: grouped.applied.map(item => ({
            ...item.campaign,
            objective: undefined,
            budgetRange: undefined,
            channel: undefined,
            deadline: item.campaign.deadlineDate,
            description: undefined,
            category: undefined,
            imageUrl: undefined,
            applicationsCount: undefined,
          })),
          selected: grouped.selected.map(item => ({
            ...item.campaign,
            objective: undefined,
            budgetRange: undefined,
            channel: undefined,
            deadline: item.campaign.deadlineDate,
            description: undefined,
            category: undefined,
            imageUrl: undefined,
            applicationsCount: undefined,
          })),
          running: grouped.running.map(item => ({
            ...item.campaign,
            objective: undefined,
            budgetRange: undefined,
            channel: undefined,
            deadline: item.campaign.deadlineDate,
            description: undefined,
            category: undefined,
            imageUrl: undefined,
            applicationsCount: undefined,
          })),
          completed: grouped.completed.map(item => ({
            ...item.campaign,
            objective: undefined,
            budgetRange: undefined,
            channel: undefined,
            deadline: item.campaign.deadlineDate,
            description: undefined,
            category: undefined,
            imageUrl: undefined,
            applicationsCount: undefined,
          })),
        },
        applications, // applicationId 매핑용
        counts: {
          applied: grouped.applied.length,
          selected: grouped.selected.length,
          running: grouped.running.length,
          completed: grouped.completed.length,
        },
      },
    });
  } catch (error: any) {
    console.error('Get influencer campaigns error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

