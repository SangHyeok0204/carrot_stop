import { FirebaseFirestore } from 'firebase-admin/firestore';

export interface Portfolio {
  id: string;
  influencerId: string;
  title: string;
  description?: string;
  imageUrl: string;
  contentUrl?: string;
  platform?: string;
  order: number;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PortfolioDocument {
  influencerId: string;
  title: string;
  description?: string;
  imageUrl: string;
  contentUrl?: string;
  platform?: string;
  order: number;
  isPublic: boolean;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

