import { 
  getAuth, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  User as FirebaseUser
} from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase/auth';

export type GoogleSignInMethod = 'popup' | 'redirect';

export interface GoogleSignInResult {
  success: boolean;
  user?: FirebaseUser;
  isNewUser?: boolean;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * 모바일 기기 감지
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Google 로그인 시도
 * @param method 로그인 방식 (popup 또는 redirect)
 */
export async function googleSignIn(
  method?: GoogleSignInMethod
): Promise<GoogleSignInResult> {
  const auth = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  
  // 한국어 설정
  provider.setCustomParameters({
    prompt: 'select_account',
    display: 'popup'
  });

  const signInMethod = method || (isMobileDevice() ? 'redirect' : 'popup');

  try {
    if (signInMethod === 'popup') {
      const result = await signInWithPopup(auth, provider);
      
      // 첫 로그인 여부 확인
      const isNewUser = 
        result.user.metadata.creationTime === result.user.metadata.lastSignInTime;

      return {
        success: true,
        user: result.user,
        isNewUser,
      };
    } else {
      // Redirect 방식
      sessionStorage.setItem('googleSignInMethod', 'redirect');
      sessionStorage.setItem('googleSignInTime', Date.now().toString());
      await signInWithRedirect(auth, provider);
      // 여기서 페이지 이동 (아래 코드는 실행되지 않음)
      return { success: true };
    }
  } catch (error: any) {
    // 팝업 차단 시 자동으로 Redirect로 전환
    if (error.code === 'auth/popup-blocked') {
      console.log('팝업이 차단되어 리다이렉트 방식으로 전환합니다.');
      sessionStorage.setItem('googleSignInMethod', 'redirect');
      sessionStorage.setItem('googleSignInTime', Date.now().toString());
      await signInWithRedirect(auth, provider);
      return { success: true };
    }

    return {
      success: false,
      error: {
        code: error.code,
        message: getFriendlyErrorMessage(error.code),
      },
    };
  }
}

/**
 * Redirect 결과 처리 (페이지 로드 시 호출)
 */
export async function handleGoogleSignInRedirect(): Promise<GoogleSignInResult | null> {
  const method = sessionStorage.getItem('googleSignInMethod');
  
  if (method !== 'redirect') {
    return null; // Redirect 로그인이 아님
  }

  const auth = getFirebaseAuth();

  try {
    const result = await getRedirectResult(auth);
    
    if (result) {
      // 로그인 성공
      sessionStorage.removeItem('googleSignInMethod');
      sessionStorage.removeItem('googleSignInTime');

      const isNewUser = 
        result.user.metadata.creationTime === result.user.metadata.lastSignInTime;

      return {
        success: true,
        user: result.user,
        isNewUser,
      };
    }

    // 결과가 없으면 취소된 것
    const signInTime = sessionStorage.getItem('googleSignInTime');
    if (signInTime) {
      const elapsed = Date.now() - parseInt(signInTime);
      // 10초 이상 경과했으면 세션 정보 삭제
      if (elapsed > 10000) {
        sessionStorage.removeItem('googleSignInMethod');
        sessionStorage.removeItem('googleSignInTime');
      }
    }

    return null;
  } catch (error: any) {
    sessionStorage.removeItem('googleSignInMethod');
    sessionStorage.removeItem('googleSignInTime');

    return {
      success: false,
      error: {
        code: error.code,
        message: getFriendlyErrorMessage(error.code),
      },
    };
  }
}

/**
 * 친근한 에러 메시지 변환 (스타일 2: 친근함/안내)
 */
function getFriendlyErrorMessage(errorCode: string): string {
  const errorMessages: { [key: string]: string } = {
    'auth/popup-blocked': '앗! 팝업이 차단되었어요. 잠시 후 다시 시도할게요 😊',
    'auth/popup-closed-by-user': '로그인이 취소되었어요. 언제든 다시 시도해주세요!',
    'auth/cancelled-popup-request': '로그인이 취소되었어요.',
    'auth/account-exists-with-different-credential': 
      '이미 다른 방법으로 가입된 이메일이에요. 기존 방법으로 로그인해주세요! 🔐',
    'auth/credential-already-in-use': 
      '이 계정은 이미 다른 사용자가 사용하고 있어요.',
    'auth/email-already-in-use': 
      '이미 사용 중인 이메일이에요. 로그인을 시도해보세요! 👋',
    'auth/invalid-credential': 
      '로그인 정보가 올바르지 않아요. 다시 시도해주세요.',
    'auth/network-request-failed': 
      '네트워크 연결을 확인해주세요 🌐',
    'auth/too-many-requests': 
      '너무 많은 시도가 있었어요. 잠시 후 다시 시도해주세요.',
    'auth/user-disabled': 
      '이 계정은 비활성화되었어요. 관리자에게 문의해주세요.',
    'auth/operation-not-allowed': 
      'Google 로그인이 활성화되지 않았어요. 관리자에게 문의해주세요.',
  };

  return errorMessages[errorCode] || '로그인 중 문제가 발생했어요. 다시 시도해주세요! 😅';
}

/**
 * 이메일로 기존 가입 방법 확인
 */
export async function checkExistingSignInMethods(email: string): Promise<{
  exists: boolean;
  methods: string[];
}> {
  try {
    const response = await fetch('/api/auth/check-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    return {
      exists: data.exists || false,
      methods: data.methods || [],
    };
  } catch (error) {
    console.error('Failed to check existing sign-in methods:', error);
    return { exists: false, methods: [] };
  }
}

/**
 * Firestore에 사용자 문서가 있는지 확인 (진짜 가입 완료 여부)
 */
export async function checkUserDocumentExists(): Promise<boolean> {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      return false;
    }

    const token = await user.getIdToken();
    const response = await fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    // 200 OK면 Firestore 문서 있음 (가입 완료)
    // 401/404면 문서 없음 (아직 가입 미완료)
    return response.ok;
  } catch (error) {
    console.error('Failed to check user document:', error);
    return false;
  }
}

