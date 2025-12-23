import { NextRequest, NextResponse } from 'next/server';
import { verifyCronSecret } from '@/lib/auth/middleware';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { getCampaignSubmissions } from '@/lib/firebase/firestore';
import { Timestamp } from 'firebase-admin/firestore';
import OpenAI from 'openai';

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid cron secret' } },
      { status: 401 }
    );
  }

  try {
    const db = getAdminFirestore();

    // 완료된 캠페인 조회
    const campaignsSnapshot = await db.collection('campaigns')
      .where('status', '==', 'COMPLETED')
      .get();

    const reportsGenerated: string[] = [];

    for (const doc of campaignsSnapshot.docs) {
      const campaignId = doc.id;
      
      // 이미 리포트가 있는지 확인
      const existingReports = await db.collection('campaigns').doc(campaignId)
        .collection('reports')
        .limit(1)
        .get();

      if (!existingReports.empty) {
        continue; // 이미 리포트가 있음
      }

      // 제출물 조회
      const submissions = await getCampaignSubmissions(campaignId);
      const approvedSubmissions = submissions.filter(s => s.status === 'APPROVED');

      if (approvedSubmissions.length === 0) {
        continue; // 승인된 제출물이 없음
      }

      // KPI 집계
      const kpiResults: any[] = [];
      const metrics: Record<string, { total: number; count: number }> = {};

      approvedSubmissions.forEach(sub => {
        Object.entries(sub.metrics).forEach(([key, value]) => {
          if (typeof value === 'number') {
            if (!metrics[key]) {
              metrics[key] = { total: 0, count: 0 };
            }
            metrics[key].total += value;
            metrics[key].count += 1;
          }
        });
      });

      Object.entries(metrics).forEach(([metric, data]) => {
        kpiResults.push({
          metric,
          actual: data.total,
          average: data.count > 0 ? data.total / data.count : 0,
        });
      });

      // LLM으로 리포트 생성 (간단한 요약)
      let narrative = '';
      try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const response = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: '캠페인 리포트를 문장 형태로 요약해주세요.',
            },
            {
              role: 'user',
              content: `다음 KPI 결과를 바탕으로 캠페인 성과를 요약해주세요:\n${JSON.stringify(kpiResults, null, 2)}`,
            },
          ],
          max_tokens: 500,
        });
        narrative = response.choices[0]?.message?.content || '';
      } catch (error) {
        console.error('LLM report generation error:', error);
        narrative = '리포트 생성 중 오류가 발생했습니다.';
      }

      // 리포트 저장
      await db.collection('campaigns').doc(campaignId)
        .collection('reports').add({
        campaignId,
        generatedAt: Timestamp.now(),
        generatedBy: 'system',
        summary: `${approvedSubmissions.length}개의 제출물이 승인되었습니다.`,
        kpiResults,
        narrative,
      });

      reportsGenerated.push(campaignId);
    }

    return NextResponse.json({
      success: true,
      data: {
        reportsGenerated: reportsGenerated.length,
        campaignIds: reportsGenerated,
      },
    });
  } catch (error: any) {
    console.error('Generate reports error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

