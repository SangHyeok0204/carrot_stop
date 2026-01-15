import { FirebaseFirestore } from 'firebase-admin/firestore';

export interface Review {
  id: string;
  campaignId: string;
  influencerId: string;
  advertiserId: string;
  rating: number; // 1-5
  comment?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ReviewDocument {
  campaignId: string;
  influencerId: string;
  advertiserId: string;
  rating: number;
  comment?: string;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt?: FirebaseFirestore.Timestamp;
}

