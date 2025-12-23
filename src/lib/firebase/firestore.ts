import { getAdminFirestore } from './admin';
import { Timestamp } from 'firebase-admin/firestore';
import { User, UserDocument } from '@/types/user';
import { Campaign, CampaignDocument, CampaignSpecVersion } from '@/types/campaign';
import { Application, ApplicationDocument } from '@/types/application';
import { Submission, SubmissionDocument } from '@/types/submission';

const db = getAdminFirestore();

// Export getAdminFirestore for use in API routes
export { getAdminFirestore };

// Helper: Firestore Timestamp를 Date로 변환
export function timestampToDate(ts: Timestamp | Date | undefined): Date | undefined {
  if (!ts) return undefined;
  if (ts instanceof Date) return ts;
  return ts.toDate();
}

// Helper: Date를 Firestore Timestamp로 변환
export function dateToTimestamp(date: Date | undefined): Timestamp | undefined {
  if (!date) return undefined;
  return Timestamp.fromDate(date);
}

// Users
export async function getUserById(uid: string): Promise<User | null> {
  const doc = await db.collection('users').doc(uid).get();
  if (!doc.exists) return null;
  
  const data = doc.data() as UserDocument;
  return {
    uid: doc.id,
    ...data,
    createdAt: timestampToDate(data.createdAt) || new Date(),
    updatedAt: timestampToDate(data.updatedAt) || new Date(),
  };
}

export async function createUser(uid: string, data: Omit<UserDocument, 'createdAt' | 'updatedAt'>): Promise<void> {
  const now = Timestamp.now();
  await db.collection('users').doc(uid).set({
    ...data,
    createdAt: now,
    updatedAt: now,
  });
}

// Campaigns
export async function getCampaignById(campaignId: string): Promise<Campaign | null> {
  const doc = await db.collection('campaigns').doc(campaignId).get();
  if (!doc.exists) return null;
  
  const data = doc.data() as CampaignDocument;
  return {
    id: doc.id,
    ...data,
    createdAt: timestampToDate(data.createdAt) || new Date(),
    updatedAt: timestampToDate(data.updatedAt) || new Date(),
    approvedAt: timestampToDate(data.approvedAt),
    openedAt: timestampToDate(data.openedAt),
    completedAt: timestampToDate(data.completedAt),
    deadlineDate: timestampToDate(data.deadlineDate),
  };
}

export async function createCampaign(data: Omit<CampaignDocument, 'createdAt' | 'updatedAt'>): Promise<string> {
  const now = Timestamp.now();
  const ref = await db.collection('campaigns').add({
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updateCampaign(campaignId: string, data: Partial<CampaignDocument>): Promise<void> {
  await db.collection('campaigns').doc(campaignId).update({
    ...data,
    updatedAt: Timestamp.now(),
  });
}

// Campaign Specs
export async function createCampaignSpec(
  campaignId: string,
  data: {
    proposalMarkdown: string;
    specJson: any;
    createdBy: string;
  }
): Promise<string> {
  const campaignRef = db.collection('campaigns').doc(campaignId);
  const campaignDoc = await campaignRef.get();
  
  if (!campaignDoc.exists) {
    throw new Error('Campaign not found');
  }

  const specsRef = campaignRef.collection('specs');
  
  // 최신 버전 확인
  const existingSpecs = await specsRef.orderBy('version', 'desc').limit(1).get();
  const nextVersion = existingSpecs.empty ? 1 : existingSpecs.docs[0].data().version + 1;

  const specRef = await specsRef.add({
    version: nextVersion,
    proposalMarkdown: data.proposalMarkdown,
    specJson: data.specJson,
    createdAt: Timestamp.now(),
    createdBy: data.createdBy,
  });

  // 캠페인에 현재 버전 참조 업데이트
  await campaignRef.update({
    currentSpecVersionId: specRef.id,
  });

  return specRef.id;
}

export async function getCampaignSpec(campaignId: string, specVersionId?: string): Promise<CampaignSpecVersion | null> {
  const campaignRef = db.collection('campaigns').doc(campaignId);
  
  if (!specVersionId) {
    const campaignDoc = await campaignRef.get();
    const campaignData = campaignDoc.data();
    specVersionId = campaignData?.currentSpecVersionId;
  }

  if (!specVersionId) return null;

  const specDoc = await campaignRef.collection('specs').doc(specVersionId).get();
  if (!specDoc.exists) return null;

  const data = specDoc.data();
  return {
    id: specDoc.id,
    campaignId,
    version: data!.version,
    proposalMarkdown: data!.proposalMarkdown,
    specJson: data!.specJson,
    createdAt: timestampToDate(data!.createdAt) || new Date(),
    createdBy: data!.createdBy,
  };
}

// Applications
export async function createApplication(data: Omit<ApplicationDocument, 'createdAt' | 'updatedAt'>): Promise<string> {
  const now = Timestamp.now();
  const campaignRef = db.collection('campaigns').doc(data.campaignId);
  const ref = await campaignRef.collection('applications').add({
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function getCampaignApplications(campaignId: string): Promise<Application[]> {
  const snapshot = await db.collection('campaigns').doc(campaignId)
    .collection('applications')
    .orderBy('createdAt', 'desc')
    .get();

  return snapshot.docs.map(doc => {
    const data = doc.data() as ApplicationDocument;
    return {
      id: doc.id,
      ...data,
      campaignId, // Override with the parameter to ensure consistency
      createdAt: timestampToDate(data.createdAt) || new Date(),
      updatedAt: timestampToDate(data.updatedAt) || new Date(),
      selectedAt: timestampToDate(data.selectedAt),
    };
  });
}

export async function updateApplication(
  campaignId: string,
  applicationId: string,
  data: Partial<ApplicationDocument>
): Promise<void> {
  await db.collection('campaigns').doc(campaignId)
    .collection('applications').doc(applicationId)
    .update({
      ...data,
      updatedAt: Timestamp.now(),
    });
}

// Submissions
export async function createSubmission(data: Omit<SubmissionDocument, 'submittedAt' | 'updatedAt'>): Promise<string> {
  const now = Timestamp.now();
  const campaignRef = db.collection('campaigns').doc(data.campaignId);
  const ref = await campaignRef.collection('submissions').add({
    ...data,
    submittedAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function getCampaignSubmissions(campaignId: string): Promise<Submission[]> {
  const snapshot = await db.collection('campaigns').doc(campaignId)
    .collection('submissions')
    .orderBy('submittedAt', 'desc')
    .get();

  return snapshot.docs.map(doc => {
    const data = doc.data() as SubmissionDocument;
    return {
      id: doc.id,
      ...data,
      campaignId, // Override with the parameter to ensure consistency
      submittedAt: timestampToDate(data.submittedAt) || new Date(),
      updatedAt: timestampToDate(data.updatedAt) || new Date(),
      approvedAt: timestampToDate(data.approvedAt),
    };
  });
}

export async function updateSubmission(
  campaignId: string,
  submissionId: string,
  data: Partial<SubmissionDocument>
): Promise<void> {
  await db.collection('campaigns').doc(campaignId)
    .collection('submissions').doc(submissionId)
    .update({
      ...data,
      updatedAt: Timestamp.now(),
    });
}

// Events (감사 로그)
export async function createEvent(data: {
  campaignId?: string;
  actorId: string;
  actorRole: 'advertiser' | 'influencer' | 'admin' | 'system';
  type: string;
  payload?: any;
}): Promise<void> {
  await db.collection('events').add({
    ...data,
    createdAt: Timestamp.now(),
  });
}

