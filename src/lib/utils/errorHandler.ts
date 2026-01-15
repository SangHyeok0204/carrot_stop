import { NextResponse } from 'next/server';

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

/**
 * API 에러 응답 생성
 */
export function createErrorResponse(
  error: ApiError,
  status: number = 500
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.details && { details: error.details }),
      },
    },
    { status }
  );
}

/**
 * 일반적인 에러를 API 에러로 변환
 */
export function handleApiError(error: any): NextResponse {
  console.error('API Error:', error);

  // 이미 구조화된 에러
  if (error.code && error.message) {
    const status = getErrorStatus(error.code);
    return createErrorResponse(error, status);
  }

  // Firestore 인덱스 에러
  if (error.code === 9 || error.message?.includes('index')) {
    return createErrorResponse(
      {
        code: 'INDEX_REQUIRED',
        message: 'Firestore 인덱스가 필요합니다. Firebase Console에서 인덱스를 생성해주세요.',
        details: error.message,
      },
      500
    );
  }

  // 인증 에러
  if (error.code === 'auth/unauthorized' || error.message?.includes('unauthorized')) {
    return createErrorResponse(
      {
        code: 'UNAUTHORIZED',
        message: '인증이 필요합니다.',
      },
      401
    );
  }

  // 권한 에러
  if (error.code === 'permission-denied' || error.message?.includes('permission')) {
    return createErrorResponse(
      {
        code: 'FORBIDDEN',
        message: '접근 권한이 없습니다.',
      },
      403
    );
  }

  // 기본 에러
  return createErrorResponse(
    {
      code: 'INTERNAL_ERROR',
      message: error.message || '알 수 없는 오류가 발생했습니다.',
      details: error.code || error.statusCode,
    },
    500
  );
}

/**
 * 에러 코드에 따른 HTTP 상태 코드 반환
 */
function getErrorStatus(code: string): number {
  const statusMap: Record<string, number> = {
    'UNAUTHORIZED': 401,
    'FORBIDDEN': 403,
    'NOT_FOUND': 404,
    'VALIDATION_ERROR': 400,
    'CONFLICT': 409,
    'RATE_LIMIT_EXCEEDED': 429,
    'INDEX_REQUIRED': 500,
    'INTERNAL_ERROR': 500,
  };

  return statusMap[code] || 500;
}

/**
 * 입력 검증 에러 생성
 */
export function createValidationError(message: string, details?: any): ApiError {
  return {
    code: 'VALIDATION_ERROR',
    message,
    details,
  };
}

/**
 * 사용자 친화적인 에러 메시지 생성
 */
export function getUserFriendlyMessage(error: ApiError): string {
  const messageMap: Record<string, string> = {
    'UNAUTHORIZED': '로그인이 필요합니다.',
    'FORBIDDEN': '접근 권한이 없습니다.',
    'NOT_FOUND': '요청한 리소스를 찾을 수 없습니다.',
    'VALIDATION_ERROR': '입력값을 확인해주세요.',
    'CONFLICT': '이미 존재하는 데이터입니다.',
    'RATE_LIMIT_EXCEEDED': '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
    'INDEX_REQUIRED': '데이터베이스 설정이 필요합니다. 관리자에게 문의해주세요.',
    'INTERNAL_ERROR': '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  };

  return messageMap[error.code] || error.message || '오류가 발생했습니다.';
}

