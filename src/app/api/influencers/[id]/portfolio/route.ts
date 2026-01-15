import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import {
  createPortfolio,
  getInfluencerPortfolios,
  updatePortfolio,
  deletePortfolio,
} from '@/lib/firebase/firestore';

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
    // 본인만 전체 조회 가능, 다른 사람은 공개 항목만
    const includePrivate = user.uid === id || user.role === 'admin';
    const portfolios = await getInfluencerPortfolios(id, includePrivate);

    return NextResponse.json({
      success: true,
      data: { portfolios },
    });
  } catch (error: any) {
    console.error('Get portfolio error:', error);
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
  const user = await verifyAuth(request);

  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  // 본인만 생성 가능
  if (user.uid !== id && user.role !== 'admin') {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { title, description, imageUrl, contentUrl, platform, order, isPublic } = body;

    if (!title || !imageUrl) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Title and imageUrl are required' } },
        { status: 400 }
      );
    }

    const portfolioId = await createPortfolio({
      influencerId: id,
      title,
      description,
      imageUrl,
      contentUrl,
      platform,
      order: order ?? 0,
      isPublic: isPublic ?? true,
    });

    return NextResponse.json({
      success: true,
      data: { id: portfolioId },
    });
  } catch (error: any) {
    console.error('Create portfolio error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyAuth(request);

  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { portfolioId, ...updateData } = body;

    if (!portfolioId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'portfolioId is required' } },
        { status: 400 }
      );
    }

    // 권한 확인은 updatePortfolio 내부에서 처리하거나 여기서 확인
    await updatePortfolio(portfolioId, updateData);

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('Update portfolio error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyAuth(request);

  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const portfolioId = searchParams.get('id');

    if (!portfolioId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'portfolioId is required' } },
        { status: 400 }
      );
    }

    await deletePortfolio(portfolioId);

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('Delete portfolio error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

