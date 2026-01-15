import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { getAdminFirestore } from '@/lib/firebase/admin';
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
    const db = getAdminFirestore();
    
    // 해당 인플루언서의 모든 제출물 조회
    const campaignsRef = db.collection('campaigns');
    const allCampaignsSnapshot = await campaignsRef.get();
    
    const allSubmissions: Array<{
      campaignId: string;
      campaignTitle: string;
      metrics: any;
      submittedAt: Date;
    }> = [];

    for (const campaignDoc of allCampaignsSnapshot.docs) {
      const campaignId = campaignDoc.id;
      const submissionsSnapshot = await campaignsRef
        .doc(campaignId)
        .collection('submissions')
        .where('influencerId', '==', id)
        .where('status', '==', 'APPROVED')
        .get();

      submissionsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        allSubmissions.push({
          campaignId,
          campaignTitle: campaignDoc.data().title || '',
          metrics: data.metrics || {},
          submittedAt: timestampToDate(data.submittedAt) || new Date(),
        });
      });
    }

    // 통계 계산
    const totalViews = allSubmissions.reduce((sum, s) => sum + (s.metrics.views || 0), 0);
    const totalLikes = allSubmissions.reduce((sum, s) => sum + (s.metrics.likes || 0), 0);
    const totalComments = allSubmissions.reduce((sum, s) => sum + (s.metrics.comments || 0), 0);
    const totalShares = allSubmissions.reduce((sum, s) => sum + (s.metrics.shares || 0), 0);
    const totalReach = allSubmissions.reduce((sum, s) => sum + (s.metrics.reach || 0), 0);
    
    const submissionCount = allSubmissions.length;
    const avgViews = submissionCount > 0 ? totalViews / submissionCount : 0;
    const avgEngagementRate = submissionCount > 0
      ? allSubmissions.reduce((sum, s) => sum + (s.metrics.engagement_rate || 0), 0) / submissionCount
      : 0;

    // 최근 캠페인 성과 (최근 5개)
    const recentCampaigns = allSubmissions
      .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())
      .slice(0, 5)
      .map(s => ({
        campaignId: s.campaignId,
        campaignTitle: s.campaignTitle,
        views: s.metrics.views || 0,
        engagementRate: s.metrics.engagement_rate || 0,
        submittedAt: s.submittedAt.toISOString(),
      }));

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalSubmissions: submissionCount,
          avgViews: Math.round(avgViews),
          avgEngagementRate: Math.round(avgEngagementRate * 100) / 100,
          totalViews,
          totalLikes,
          totalComments,
          totalShares,
          totalReach,
        },
        recentCampaigns,
      },
    });
  } catch (error: any) {
    console.error('Get insights error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

