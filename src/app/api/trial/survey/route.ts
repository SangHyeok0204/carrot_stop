import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { createSurvey } from '@/lib/firebase/firestore';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  const user = await verifyAuth(request);

  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { answers } = body;

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Answers array is required' } },
        { status: 400 }
      );
    }

    const surveyId = await createSurvey({
      userId: user.uid,
      answers,
    });

    // 설문 결과 분석 및 사용자 프로필에 저장
    const { analyzeSurveyAnswers } = await import('@/lib/utils/surveyAnalyzer');
    const analysis = analyzeSurveyAnswers(answers);

    // 사용자 프로필 업데이트 (설문 결과 기반)
    const db = getAdminFirestore();
    const userRef = db.collection('users').doc(user.uid);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      const existingProfile = userDoc.data()?.profile || {};
      await userRef.update({
        profile: {
          ...existingProfile,
          surveyAnalysis: analysis,
          surveyCompleted: true,
        },
        updatedAt: Timestamp.now(),
      });
    }

    return NextResponse.json({
      success: true,
      data: { 
        id: surveyId,
        analysis,
      },
    });
  } catch (error: any) {
    console.error('Create survey error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

