import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, requireRole } from '@/lib/auth/middleware';
import { generateCampaignSpec } from '@/lib/llm/client';
import { createCampaign, createCampaignSpec, updateCampaign, createEvent } from '@/lib/firebase/firestore';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  // 권한 체크
  const authCheck = await requireRole(['advertiser'])(request);
  if (authCheck) return authCheck;

  const user = (request as any).user;
  
  try {
    const body = await request.json();
    const { naturalLanguageInput } = body;

    if (!naturalLanguageInput || typeof naturalLanguageInput !== 'string' || naturalLanguageInput.trim().length < 10) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input. Please provide a detailed description (at least 10 characters).' } },
        { status: 400 }
      );
    }

    // LLM으로 캠페인 생성
    const llmResponse = await generateCampaignSpec(naturalLanguageInput);

    // 제목 추출: specJson.title 우선, 없으면 제안서에서 추출, 없으면 objective 사용
    let campaignTitle = '';
    if (llmResponse.specJson.title) {
      campaignTitle = llmResponse.specJson.title;
    } else {
      const titleMatch = llmResponse.proposalMarkdown.match(/^#\s+(.+)$/m);
      if (titleMatch) {
        campaignTitle = titleMatch[1];
      } else {
        // 최후의 수단: objective를 제목으로 사용 (100자 제한)
        campaignTitle = llmResponse.specJson.objective.substring(0, 100);
      }
    }

    // 캠페인 문서 생성
    const campaignId = await createCampaign({
      advertiserId: user.uid,
      status: 'GENERATED',
      title: campaignTitle,
      naturalLanguageInput: naturalLanguageInput.trim(),
    });

    // Spec 버전 생성
    const specVersionId = await createCampaignSpec(campaignId, {
      proposalMarkdown: llmResponse.proposalMarkdown,
      specJson: llmResponse.specJson,
      createdBy: user.uid,
    });

    // 일정 정보 업데이트
    const deadlineDate = llmResponse.specJson.schedule.estimated_duration_days 
      ? Timestamp.fromDate(new Date(Date.now() + llmResponse.specJson.schedule.estimated_duration_days * 24 * 60 * 60 * 1000))
      : undefined;

    await updateCampaign(campaignId, {
      deadlineDate,
      estimatedDuration: llmResponse.specJson.schedule.estimated_duration_days,
    });

    // 이벤트 기록
    await createEvent({
      campaignId,
      actorId: user.uid,
      actorRole: 'advertiser',
      type: 'campaign_generated',
      payload: { specVersionId },
    });

    return NextResponse.json({
      success: true,
      data: {
        campaignId,
        proposalMarkdown: llmResponse.proposalMarkdown,
        spec: llmResponse.specJson,
        status: 'GENERATED',
      },
    });
  } catch (error: any) {
    console.error('Generate campaign error:', error);
    
    const errorCode = error.message.includes('OPENAI_API_KEY') ? 'LLM_ERROR' : 'INTERNAL_ERROR';
    
    return NextResponse.json(
      { success: false, error: { code: errorCode, message: error.message } },
      { status: 500 }
    );
  }
}

