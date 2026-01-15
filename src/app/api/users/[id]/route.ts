import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { getUserById } from '@/lib/firebase/firestore';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await verifyAuth(request);

  // 인증은 선택사항 (공개 프로필 조회)
  // 인증된 사용자는 더 많은 정보를 볼 수 있음

  try {
    const userData = await getUserById(id);
    
    if (!userData) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      );
    }

    // 공개 정보만 반환 (인증된 사용자는 더 많은 정보)
    const response: any = {
      id: userData.id,
      displayName: userData.displayName,
      email: user?.uid === id ? userData.email : undefined, // 본인만 이메일 조회 가능
      role: userData.role,
      profile: {
        bio: userData.profile?.bio,
        companyName: userData.profile?.companyName,
        nickname: userData.profile?.nickname,
        platforms: userData.profile?.platforms,
        photoURL: userData.profile?.photoURL,
        location: userData.profile?.location,
        availableHours: userData.profile?.availableHours,
        careerYears: userData.profile?.careerYears,
        careerMonths: userData.profile?.careerMonths,
        totalCareerYears: userData.profile?.totalCareerYears,
      },
      followerCount: userData.followerCount,
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
