export type SubmissionStatus = "SUBMITTED" | "NEEDS_FIX" | "APPROVED";

export interface SubmissionMetrics {
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  engagement_rate?: number;
  reach?: number;
  impressions?: number;
  [key: string]: number | undefined;
}

export interface Submission {
  id: string;
  campaignId: string;
  influencerId: string;
  applicationId: string;
  postUrl: string;
  screenshotUrls: string[];
  metrics: SubmissionMetrics;
  status: SubmissionStatus;
  submittedAt: Date;
  updatedAt: Date;
  approvedAt?: Date;
  feedback?: string;
}

export interface SubmissionDocument {
  campaignId: string;
  influencerId: string;
  applicationId: string;
  postUrl: string;
  screenshotUrls: string[];
  metrics: SubmissionMetrics;
  status: SubmissionStatus;
  submittedAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  approvedAt?: FirebaseFirestore.Timestamp;
  feedback?: string;
}

