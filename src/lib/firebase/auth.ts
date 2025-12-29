import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

/**
 * 환경별 Firebase 설정 (개발/스테이징/프로덕션)
 * 환경변수를 통해 자동 선택됨
 */
const getFirebaseConfig = () => {
  // 환경 감지
  const env = process.env.NEXT_PUBLIC_APP_ENV || process.env.NODE_ENV || 'development';
  
  // 기본 설정 (현재는 모든 환경에서 동일하지만, 나중에 환경별로 분리 가능)
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  // 나중에 환경별 분리 시 아래와 같이 사용 가능:
  // if (env === 'development') {
  //   return { ...config, projectId: 'your-dev-project-id' };
  // } else if (env === 'staging') {
  //   return { ...config, projectId: 'your-staging-project-id' };
  // } else if (env === 'production') {
  //   return { ...config, projectId: 'your-prod-project-id' };
  // }

  return config;
};

const firebaseConfig = getFirebaseConfig();

let app: FirebaseApp | undefined;
let auth: Auth | undefined;

export function getFirebaseApp(): FirebaseApp {
  if (app) {
    return app;
  }

  const apps = getApps();
  if (apps.length > 0) {
    app = apps[0];
    return app;
  }

  app = initializeApp(firebaseConfig);
  return app;
}

export function getFirebaseAuth(): Auth {
  if (auth) {
    return auth;
  }
  auth = getAuth(getFirebaseApp());
  return auth;
}

/**
 * 현재 환경 확인
 */
export function getCurrentEnvironment(): string {
  return process.env.NEXT_PUBLIC_APP_ENV || process.env.NODE_ENV || 'development';
}

