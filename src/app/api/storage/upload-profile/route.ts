import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { getAdminStorage } from '@/lib/firebase/admin';

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
    const { fileName, contentType } = body;

    if (!fileName || !contentType) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } },
        { status: 400 }
      );
    }

    // 이미지 타입 검증
    if (!contentType.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Only image files are allowed' } },
        { status: 400 }
      );
    }

    const storage = getAdminStorage();
    const bucket = storage.bucket();

    // 프로필 사진 파일 경로 생성: users/{userId}/profile/{timestamp}_{fileName}
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `users/${user.uid}/profile/${timestamp}_${sanitizedFileName}`;

    const file = bucket.file(filePath);

    // Signed URL 생성 (5분 유효)
    const [uploadUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 5 * 60 * 1000, // 5분
      contentType,
    });

    // Public URL 생성 (업로드 후 접근용)
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

    return NextResponse.json({
      success: true,
      data: {
        uploadUrl,
        filePath,
        publicUrl,
      },
    });
  } catch (error: any) {
    console.error('Generate profile upload URL error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
