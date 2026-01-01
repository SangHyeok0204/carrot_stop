'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

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
}

// ============================================
// Mock Users
// ============================================

const MOCK_USERS: Record<string, User> = {
  'adv-001': {
    uid: 'adv-001',
    email: 'advertiser@test.com',
    displayName: '뷰티브랜드A',
    role: 'advertiser',
    companyName: '뷰티브랜드A',
  },
  'inf-001': {
    uid: 'inf-001',
    email: 'influencer@test.com',
    displayName: '인플루언서김',
    role: 'influencer',
    nickname: '뷰티크리에이터',
  },
  'admin-001': {
    uid: 'admin-001',
    email: 'admin@test.com',
    displayName: '관리자',
    role: 'admin',
  },
};

// ============================================
// Context
// ============================================

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isLoggedIn: boolean;

  // Auth Methods
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  mockLogin: (role: UserRole) => void; // 개발용 빠른 로그인

  // Helpers
  getMyPagePath: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// Provider
// ============================================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 초기 로드 시 localStorage에서 사용자 복원
  useEffect(() => {
    const savedUser = localStorage.getItem('mockUser');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('mockUser');
      }
    }
    setIsLoading(false);
  }, []);

  // 사용자 변경 시 localStorage에 저장
  useEffect(() => {
    if (user) {
      localStorage.setItem('mockUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('mockUser');
    }
  }, [user]);

  // 이메일 로그인 (mock)
  const login = useCallback(async (email: string, _password: string): Promise<boolean> => {
    // Mock: 이메일로 사용자 찾기
    const foundUser = Object.values(MOCK_USERS).find(u => u.email === email);
    if (foundUser) {
      setUser(foundUser);
      return true;
    }
    return false;
  }, []);

  // 로그아웃
  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('mockUser');
  }, []);

  // 개발용 빠른 로그인
  const mockLogin = useCallback((role: UserRole) => {
    const mockUser = Object.values(MOCK_USERS).find(u => u.role === role);
    if (mockUser) {
      setUser(mockUser);
    }
  }, []);

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
    isLoading,
    isLoggedIn: !!user,
    login,
    logout,
    mockLogin,
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
