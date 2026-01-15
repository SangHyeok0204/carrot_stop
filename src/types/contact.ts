import { FirebaseFirestore } from 'firebase-admin/firestore';

export type ContactStatus = 'PENDING' | 'RESPONDED' | 'CLOSED';

export interface Contact {
  id: string;
  name: string;
  email: string;
  message: string;
  status: ContactStatus;
  createdAt: Date;
  respondedAt?: Date;
  response?: string;
}

export interface ContactDocument {
  name: string;
  email: string;
  message: string;
  status: ContactStatus;
  createdAt: FirebaseFirestore.Timestamp;
  respondedAt?: FirebaseFirestore.Timestamp;
  response?: string;
}

