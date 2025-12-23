export type ApplicationStatus = "APPLIED" | "REJECTED" | "SELECTED";

export interface Application {
  id: string;
  campaignId: string;
  influencerId: string;
  message?: string;
  status: ApplicationStatus;
  createdAt: Date;
  updatedAt: Date;
  selectedAt?: Date;
}

export interface ApplicationDocument {
  campaignId: string;
  influencerId: string;
  message?: string;
  status: ApplicationStatus;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  selectedAt?: FirebaseFirestore.Timestamp;
}

