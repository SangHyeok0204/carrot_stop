export type CampaignStatus = 
  | "DRAFT"
  | "GENERATED"
  | "REVIEWED"
  | "CLARIFYING"
  | "APPROVED"
  | "OPEN"
  | "MATCHING"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export interface TargetAudience {
  demographics?: string;
  interests?: string[];
  behaviors?: string[];
}

export interface ContentType {
  platform: string;
  format: string;
  rationale?: string;
}

export interface Schedule {
  estimated_duration_days: number;
  milestones?: Array<{
    phase: string;
    days_from_start: number;
  }>;
}

export interface BudgetRange {
  min: number;
  max: number;
  currency: string;
  rationale: string;
}

export interface KPI {
  metric: string;
  value: number;
  source?: string;
}

export interface KPIGroup {
  guaranteed?: KPI[];
  target?: KPI[];
  reference?: KPI[];
}

export interface RiskFlag {
  level: "low" | "medium" | "high";
  description: string;
  mitigation?: string;
}

export interface ClarificationQuestion {
  question: string;
  type: "single_choice" | "multiple_choice";
  options: string[];
  required: boolean;
}

export interface CampaignSpec {
  objective: string;
  target_audience: TargetAudience;
  tone_and_mood: string[];
  recommended_content_types: ContentType[];
  schedule: Schedule;
  budget_range: BudgetRange;
  kpis: KPIGroup;
  constraints: {
    must_have?: string[];
    must_not?: string[];
  };
  risk_flags?: RiskFlag[];
  clarification_questions: ClarificationQuestion[];
}

export interface Campaign {
  id: string;
  advertiserId: string;
  status: CampaignStatus;
  title: string;
  naturalLanguageInput?: string;
  createdAt: Date;
  updatedAt: Date;
  approvedAt?: Date;
  openedAt?: Date;
  completedAt?: Date;
  deadlineDate?: Date;
  estimatedDuration?: number;
  currentSpecVersionId?: string;
  selectedInfluencerIds?: string[];
}

export interface CampaignSpecVersion {
  id: string;
  campaignId: string;
  version: number;
  proposalMarkdown: string;
  specJson: CampaignSpec;
  createdAt: Date;
  createdBy: string;
}

export interface CampaignDocument {
  advertiserId: string;
  status: CampaignStatus;
  title: string;
  naturalLanguageInput?: string;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  approvedAt?: FirebaseFirestore.Timestamp;
  openedAt?: FirebaseFirestore.Timestamp;
  completedAt?: FirebaseFirestore.Timestamp;
  deadlineDate?: FirebaseFirestore.Timestamp;
  estimatedDuration?: number;
  currentSpecVersionId?: string;
  selectedInfluencerIds?: string[];
}

