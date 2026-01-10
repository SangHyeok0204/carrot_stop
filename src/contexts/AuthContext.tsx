'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser
} from 'firebase/auth';

// ============================================
// Types
// ============================================

export type UserRole = 'advertiser' | 'influencer' | 'admin';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  companyName?: string; // advertiser
  nickname?: string; // influencer
  photoURL?: string;
}

// ============================================
// Context
// ============================================

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  isLoggedIn: boolean;

  // Auth Methods
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;

  // Helpers
  getMyPagePath: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// Provider
// ============================================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Firestore에서 사용자 정보 가져오기
  const fetchUserData = useCallback(async (fbUser: FirebaseUser): Promise<User | null> => {
    try {
      const token = await fbUser.getIdToken();
      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success && data.data) {
        return {
          uid: fbUser.uid,
          email: fbUser.email || '',
          displayName: data.data.displayName || fbUser.displayName || '',
          role: data.data.role as UserRole,
          companyName: data.data.profile?.companyName,
          nickname: data.data.profile?.nickname,
          photoURL: data.data.profile?.photoURL || fbUser.photoURL || undefined,
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      return null;
    }
  }, []);

  // Firebase Auth 상태 구독
  useEffect(() => {
    const auth = getFirebaseAuth();

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);

      if (fbUser) {
        // Firebase 인증됨 -> Firestore에서 사용자 정보 가져오기
        const userData = await fetchUserData(fbUser);
        setUser(userData);
      } else {
        // 로그아웃 상태
        setUser(null);
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUserData]);

  // 이메일/비밀번호 로그인
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const auth = getFirebaseAuth();
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged가 자동으로 user 상태 업데이트
      return true;
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      throw error; // 에러를 상위로 전파해서 UI에서 처리
    }
  }, []);

  // 로그아웃
  const logout = useCallback(async () => {
    try {
      const auth = getFirebaseAuth();
      await signOut(auth);
      // onAuthStateChanged가 자동으로 user를 null로 설정
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }, []);

  // 사용자 정보 새로고침
  const refreshUser = useCallback(async () => {
    if (firebaseUser) {
      const userData = await fetchUserData(firebaseUser);
      setUser(userData);
    }
  }, [firebaseUser, fetchUserData]);

  // 역할별 마이페이지 경로
  const getMyPagePath = useCallback(() => {
    if (!user) return '/auth/login';

    switch (user.role) {
      case 'advertiser':
        return '/advertiser/dashboard';
      case 'influencer':
        return '/influencer/feed';
      case 'admin':
        return '/admin/dashboard';
      default:
        return '/main';
    }
  }, [user]);

  const value: AuthContextType = {
    user,
    firebaseUser,
    isLoading,
    isLoggedIn: !!user,
    login,
    logout,
    refreshUser,
    getMyPagePath,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================
// Hook
// ============================================

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
