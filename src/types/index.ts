export type TaskType = 'RECURRING' | 'DELEGATION';

export type TaskStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'SUBMITTED_FOR_VERIFICATION'
  | 'VERIFIED_DONE'
  | 'NEEDS_CORRECTION';

export type TaskPriority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';

export type RecurrenceFrequency = 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';

export interface RecurrenceConfig {
  frequency: RecurrenceFrequency;
  daysOfWeek?: number[]; // 0 = Sun, 1 = Mon, etc.
  timeOfDay?: string; // "09:00"
  streakCount: number;
  lastCompletedDate?: string;
  nextDueDate: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  roleTitle: string;
  department: string;
  avatar: string;
  accentColor: string;
  isOwner?: boolean;
  password?: string;
}

export interface ProofSubmission {
  submittedAt: string;
  submittedByMemberId: string;
  submittedByRole: 'PRIMARY' | 'SECONDARY' | 'SUB_SECONDARY';
  description: string;
  imageUrl?: string;
  imageCaption?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  timeSpentMinutes?: number;
  checklistCompleted?: string[];
  submissionAttempt: number;
}

export interface CorrectionRequest {
  requestedAt: string;
  requestedByOwnerName: string;
  feedback: string;
  specificIssues: string[];
  resolved: boolean;
}

export interface VerificationRecord {
  verifiedAt: string;
  verifiedByOwnerName: string;
  ownerNotes?: string;
  awardedScore: number; // e.g. 100 for 1st attempt, 80 after correction
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  action:
    | 'CREATED'
    | 'STATUS_CHANGED'
    | 'SUBMITTED_FOR_VERIFICATION'
    | 'VERIFIED'
    | 'CORRECTION_REQUESTED'
    | 'RESUBMITTED'
    | 'UPDATED'
    | 'MEETING_LINK_DISPATCHED';
  actorName: string;
  actorId: string;
  details: string;
}

export type MeetingType =
  | 'PURCHASE_MEETING'
  | 'IMS_MEETING'
  | 'SALE_MEETING'
  | 'EXECUTIVE_REVIEW'
  | 'VENDOR_PROCUREMENT'
  | 'OPERATIONS_LOGISTICS'
  | 'QUARTERLY_STRATEGY'
  | 'GENERAL_TEAM_SYNC'
  | 'CUSTOM';

export interface MeetingEmailLog {
  timestamp: string;
  sentBy: string;
  sentByEmail: string;
  recipients: string[];
  meetingLink: string;
  method: 'MAIL_APP_OPENED' | 'DISPATCHED_IN_APP';
}

export interface MeetingDetails {
  isMeeting: boolean;
  meetingType: MeetingType | string;
  meetingTypeLabel: string;
  meetingLink?: string; // Google Meet, Zoom, MS Teams
  scheduledDate?: string;
  scheduledTime?: string;
  agendaNotes?: string;
  linkDispatched: boolean;
  dispatchedAt?: string;
  dispatchedByMemberId?: string;
  dispatchedByMemberName?: string;
  recipientEmails: string[]; // secondary and sub-sec doer emails
  emailSubject?: string;
  emailBody?: string;
  emailDispatchLogs?: MeetingEmailLog[];
}

export interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  category: string;
  createdAt: string;
  dueDate: string;
  
  // 3-tier Delegation Structure:
  primaryDoerId: string;
  secondaryDoerId: string;
  subSecondaryDoerId: string;

  // Meeting Workflow & Delegation Options
  meetingDetails?: MeetingDetails;

  // Recurrence settings (for Recurring tasks)
  recurrence?: RecurrenceConfig;

  // Requirements checklist
  checklist: ChecklistItem[];

  // Proof & Verification details
  currentSubmission?: ProofSubmission;
  submissionHistory: ProofSubmission[];
  
  // Correction workflow
  correctionHistory: CorrectionRequest[];
  latestCorrection?: CorrectionRequest;

  // Final verification record
  verificationRecord?: VerificationRecord;

  // Audit trail
  activityLogs: ActivityLog[];
}

export interface NotificationItem {
  id: string;
  taskId: string;
  taskTitle: string;
  type:
    | 'CORRECTION_REQUESTED'
    | 'TASK_VERIFIED'
    | 'SUBMITTED_FOR_REVIEW'
    | 'TASK_ASSIGNED'
    | 'SYSTEM_ALERT'
    | 'MEETING_LINK_DISPATCHED'
    | 'MEETING_DELEGATED';
  recipientId: string; // member id or 'OWNER'
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'URGENT' | 'HIGH' | 'NORMAL';
}

export interface DoerScorecard {
  memberId: string;
  memberName: string;
  avatar: string;
  roleTitle: string;
  totalAssignedPrimary: number;
  totalAssignedSecondary: number;
  totalAssignedSubSecondary: number;
  totalCompletedAndVerified: number;
  pendingVerificationCount: number;
  needsCorrectionCount: number;
  inProgressCount: number;
  verifiedFirstAttemptCount: number;
  firstAttemptApprovalRate: number; // percentage
  onTimeCompletionRate: number; // percentage
  overallAccountabilityScore: number; // 0 - 100
}
