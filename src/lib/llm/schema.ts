import { z } from 'zod';
import { CampaignSpec } from '@/types/campaign';

export const ClarificationQuestionSchema = z.object({
  question: z.string().min(10).max(200),
  type: z.enum(['single_choice', 'multiple_choice']),
  options: z.array(z.string().min(1).max(50)).min(2).max(4),
  required: z.boolean(),
});

export const TargetAudienceSchema = z.object({
  demographics: z.string().optional(),
  interests: z.array(z.string()).optional(),
  behaviors: z.array(z.string()).optional(),
});

export const ContentTypeSchema = z.object({
  platform: z.string(),
  format: z.string(),
  rationale: z.string().optional(),
});

export const ScheduleSchema = z.object({
  estimated_duration_days: z.number().int().positive(),
  milestones: z.array(z.object({
    phase: z.string(),
    days_from_start: z.number().int().nonnegative(),
  })).optional(),
});

export const BudgetRangeSchema = z.object({
  min: z.number().nonnegative(),
  max: z.number().nonnegative(),
  currency: z.string().default('KRW'),
  rationale: z.string(),
});

export const KPISchema = z.object({
  metric: z.string(),
  value: z.number().nonnegative(),
  source: z.string().optional(),
});

export const KPIGroupSchema = z.object({
  guaranteed: z.array(KPISchema).optional(),
  target: z.array(KPISchema).optional(),
  reference: z.array(KPISchema).optional(),
});

export const RiskFlagSchema = z.object({
  level: z.enum(['low', 'medium', 'high']),
  description: z.string(),
  mitigation: z.string().optional(),
});

export const CampaignSpecSchema = z.object({
  objective: z.string().min(20).max(500),
  target_audience: TargetAudienceSchema,
  tone_and_mood: z.array(z.string()).min(1),
  recommended_content_types: z.array(ContentTypeSchema).min(1),
  schedule: ScheduleSchema,
  budget_range: BudgetRangeSchema,
  kpis: KPIGroupSchema,
  constraints: z.object({
    must_have: z.array(z.string()).optional(),
    must_not: z.array(z.string()).optional(),
  }),
  risk_flags: z.array(RiskFlagSchema).optional(),
  clarification_questions: z.array(ClarificationQuestionSchema).max(3),
});

export const LLMResponseSchema = z.object({
  proposalMarkdown: z.string().min(500),
  specJson: CampaignSpecSchema,
});

export type LLMResponse = z.infer<typeof LLMResponseSchema>;

