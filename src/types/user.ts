export type UserRole = "advertiser" | "influencer" | "admin";

export interface UserProfile {
  companyName?: string;
  bio?: string;
  platforms?: string[];
  followerCount?: number;
}

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  profile?: UserProfile;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserDocument {
  email: string;
  displayName?: string;
  role: UserRole;
  profile?: UserProfile;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

