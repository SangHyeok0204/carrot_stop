import { FirebaseFirestore } from 'firebase-admin/firestore';

export interface SurveyAnswer {
  questionId: string;
  answer: string | string[];
}

export interface Survey {
  id: string;
  userId?: string;
  answers: SurveyAnswer[];
  createdAt: Date;
}

export interface SurveyDocument {
  userId?: string;
  answers: SurveyAnswer[];
  createdAt: FirebaseFirestore.Timestamp;
}

