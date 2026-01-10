export type UserRole = "advertiser" | "influencer" | "admin";

export type AuthProvider = "password" | "google.com" | "kakao.com" | "naver.com";

export interface UserProfile {
  // 공통
  photoURL?: string;  // Google 프로필 사진 URL
  bio?: string;       // 소개글
  location?: string;  // 위치 (예: 성수, 한남동)
  websiteUrl?: string; // 웹사이트 URL

  // SNS 링크 (공통)
  instagramUrl?: string;
  youtubeUrl?: string;

  // 광고주용
  companyName?: string;
  handle?: string;    // @핸들명 (예: @cafename)

  // 인플루언서용
  nickname?: string;  // 활동명/닉네임
  platforms?: string[];
  followerCount?: number;
}

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  profile?: UserProfile;
  authProviders?: AuthProvider[];  // 연결된 인증 제공업체 목록
  createdAt: Date;
  updatedAt: Date;
}

export interface UserDocument {
  email: string;
  displayName?: string;
  role: UserRole;
  profile?: UserProfile;
  authProviders?: AuthProvider[];
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

