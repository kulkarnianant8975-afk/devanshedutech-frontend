// Course DTOs
export interface CourseRequestDTO {
  name: string;
  description: string;
  duration: string;
  price: number;
  level?: string;
  category: string;
  image?: string;
}

export interface CourseResponseDTO {
  id: string;
  name: string;
  description: string;
  duration: string;
  price: number;
  level?: string;
  category: string;
  image?: string;
}

// Lead DTOs
export interface LeadRequestDTO {
  fullName: string;
  email?: string;
  mobileNumber: string;
  education: string;
  cityName: string;
  courseInterested?: string;
}

/** @deprecated the pipeline uses {@link LeadDTO}; kept so older imports still compile. */
export interface LeadResponseDTO {
  id: string;
  fullName: string;
  email?: string;
  mobileNumber: string;
  education: string;
  cityName: string;
  courseInterested?: string;
  status: string;
  createdAt: string;
}

export type StageName =
  | 'NEW' | 'CONTACTED' | 'DEMO_BOOKED' | 'DEMO_DONE'
  | 'FEE_DISCUSSION' | 'ENROLLED' | 'LOST';

export type GradeName = 'HOT' | 'WARM' | 'COLD';

export type OutcomeName =
  | 'CONNECTED' | 'NO_ANSWER' | 'THINKING' | 'PARENTS' | 'FEE_OBJECTION'
  | 'COMPARING' | 'SILENT' | 'DEMO_BOOKED' | 'DEMO_ATTENDED'
  | 'READY_TO_ENROL' | 'NOT_INTERESTED' | 'WRONG_NUMBER';

export interface LeadDTO {
  id: string;
  fullName: string;
  email?: string;
  mobileNumber: string;
  education?: string;
  cityName?: string;
  courseInterested?: string;
  status: string;
  createdAt: string;

  stage?: StageName;
  stageLabel?: string;
  grade?: GradeName;
  gradeLabel?: string;
  source?: string;
  sourceLabel?: string;
  sourceDetail?: string;
  background?: string;
  backgroundLabel?: string;

  assignedToId?: string;
  assignedToName?: string;

  nextTouchOn?: string;
  nextTouchNote?: string;
  /** Present only when the next touch has already passed. */
  daysOverdue?: number;
  blankNextTouch: boolean;

  lastTouchAt?: string;
  lastTouchNote?: string;
  firstRespondedAt?: string;
  /** Minutes from enquiry to first human reply — the playbook's five-minute metric. */
  firstResponseMinutes?: number;
  lastInboundAt?: string;
  callAttempts?: number;

  ladderStep?: number;
  ladderTotal?: number;
  ladderPausedUntil?: string;
  ladderPauseReason?: string;
  ladderCurrentTitle?: string;

  lostReason?: string;
  lostNote?: string;
  /** Set when a lead decayed to lost without ever really being worked. */
  lostUnworked?: boolean;
  updatesOnly?: boolean;
  optedOut?: boolean;
  notes?: string;
}

export interface LeadActivityDTO {
  id: string;
  type: string;
  typeLabel?: string;
  outcome?: OutcomeName;
  outcomeLabel?: string;
  direction?: 'INBOUND' | 'OUTBOUND' | 'INTERNAL';
  summary: string;
  detail?: string;
  createdByName?: string;
  createdAt: string;
}

export interface LadderStepDTO {
  id: string;
  grade: GradeName;
  stepNo: number;
  dayOffset: number;
  title: string;
  action?: string;
  autoSend?: boolean;
  active?: boolean;
  /** True for steps this lead has already passed. Absent outside a lead's context. */
  reached?: boolean;
}

export interface LeadDetailDTO {
  lead: LeadDTO;
  activities: LeadActivityDTO[];
  ladder?: LadderStepDTO[];
}

export interface LeadPatchDTO {
  grade?: GradeName;
  stage?: StageName;
  source?: string;
  background?: string;
  sourceDetail?: string;
  assignedToId?: string;
  clearOwner?: boolean;
  nextTouchOn?: string;
  nextTouchNote?: string;
  notes?: string;
  courseInterested?: string;
  lostReason?: string;
  lostNote?: string;
  reason?: string;
}

export interface OutcomeDTO {
  outcome: OutcomeName;
  note?: string;
  lostReason?: string;
}

export interface LeadQueryParams {
  stage?: StageName;
  grade?: GradeName;
  owner?: string;
  q?: string;
  unassignedOnly?: boolean;
  openOnly?: boolean;
  page?: number;
  size?: number;
}

export interface PageResponseDTO<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

export interface MyDayDTO {
  awaitingFirstReply: LeadDTO[];
  overdue: LeadDTO[];
  dueToday: LeadDTO[];
  blankNextTouch: LeadDTO[];
  awaitingCount: number;
  overdueCount: number;
  dueTodayCount: number;
  blankNextTouchCount: number;
}

export interface OptionDTO {
  value: string;
  label: string;
  hint?: string;
}

export interface LeadOptionsDTO {
  stages: OptionDTO[];
  grades: OptionDTO[];
  sources: OptionDTO[];
  backgrounds: OptionDTO[];
  outcomes: OptionDTO[];
  lostReasons: OptionDTO[];
}

export interface CaptureResponseDTO {
  id: string;
  fullName: string;
  duplicate: boolean;
  message: string;
}

// User DTOs
export type RoleName =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'MANAGER'
  | 'SALES_EXECUTIVE'
  | 'VIEWER'
  | 'NONE';

/**
 * Permissions are the server's answer to "what may this person do".
 * The client uses them to decide what to render; the server re-checks every request,
 * so hiding a control here is a convenience, never a security boundary.
 */
export type PermissionName =
  | 'USER_VIEW' | 'USER_MANAGE' | 'ROLE_ASSIGN' | 'ROLE_ASSIGN_ADMIN'
  | 'LEAD_VIEW_OWN' | 'LEAD_VIEW_ALL' | 'LEAD_CREATE' | 'LEAD_EDIT'
  | 'LEAD_ASSIGN' | 'LEAD_DELETE'
  | 'REPORT_VIEW' | 'REPORT_VIEW_TEAM'
  | 'CONTENT_MANAGE' | 'SETTINGS_MANAGE' | 'AUDIT_VIEW';

export interface UserResponseDTO {
  id: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: string;
  roleLabel?: string;
  active?: boolean;
  permissions?: PermissionName[];
}

// Team management DTOs
export interface StaffUserDTO {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phone?: string;
  role: RoleName;
  roleLabel: string;
  active: boolean;
  roleLockedByConfig: boolean;
  createdAt?: string;
  lastLoginAt?: string;
}

export interface RoleOptionDTO {
  value: RoleName;
  label: string;
  description: string;
  grantable: boolean;
}

export interface TeamResponseDTO {
  users: StaffUserDTO[];
  roles: RoleOptionDTO[];
}

export interface CreateUserDTO {
  email: string;
  password: string;
  displayName: string;
  phone?: string;
  role: RoleName;
}

export interface AuditEntryDTO {
  id: string;
  actorEmail?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  detail?: string;
  ipAddress?: string;
  createdAt: string;
}

// Hiring DTOs
export interface HiringRequestDTO {
  title: string;
  company: string;
  location: string;
  type: string;
  description: string;
  requirements: string;
  salary?: string;
  link?: string;
}

export interface HiringResponseDTO {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  description: string;
  requirements: string;
  salary?: string;
  link?: string;
  createdAt: string;
}

// Mentor DTOs
export interface MentorRequestDTO {
  name: string;
  role: string;
  description: string;
  imageUrl: string;
  linkedinUrl?: string;
}

export interface MentorResponseDTO {
  id: string;
  name: string;
  role: string;
  description: string;
  imageUrl: string;
  linkedinUrl?: string;
  createdAt: string;
}

// Placed Student DTOs
export interface PlacedStudentRequestDTO {
  name: string;
  company: string;
  role: string;
  salaryPackage: string;
  testimonial: string;
  imageUrl: string;
}

export interface PlacedStudentResponseDTO {
  id: string;
  name: string;
  company: string;
  role: string;
  salaryPackage: string;
  testimonial: string;
  imageUrl: string;
  createdAt: string;
}
// Stats DTOs
export interface StatsResponse {
  totalLeads: number;
  totalCourses: number;
  totalHiring: number;
  totalMentors: number;
  totalPlacedStudents: number;
  monthlyLeads: MonthlyLead[];
}

export interface MonthlyLead {
  name: string;
  leads: number;
}


// ---------- Analytics ----------

export interface MetricDTO {
  key: string;
  label: string;
  /** Null when there is not enough data to state a figure honestly. */
  value: number | null;
  unit: string;
  target: string;
  explanation: string;
  healthy: boolean | null;
  sampleSize: number;
}

export interface FunnelStepDTO {
  stage: string;
  label: string;
  reached: number;
  percentOfTotal: number;
  dropFromPrevious: number | null;
}

export interface SourcePerformanceDTO {
  source: string;
  label: string;
  leads: number;
  enrolled: number;
  conversionRate: number | null;
}

export interface WeeklyCountDTO {
  weekStarting: string;
  leads: number;
}

export interface CounsellorScoreDTO {
  userId: string;
  name: string;
  activeLeads: number;
  enrolled: number;
  conversionRate: number | null;
  overdueTouches: number;
  blankNextTouch: number;
  lostUnworked: number;
}

export interface PipelineMetricsDTO {
  metrics: MetricDTO[];
  funnel: FunnelStepDTO[];
  sources: SourcePerformanceDTO[];
  weekly: WeeklyCountDTO[];
  counsellors: CounsellorScoreDTO[];
  totalLeads: number;
  windowDescription: string;
}

export interface BoardColumnDTO {
  stage: StageName;
  label: string;
  leads: LeadDTO[];
  /** The real number at this stage; leads may be capped. */
  total: number;
}

export interface BoardDTO {
  columns: BoardColumnDTO[];
  columnLimit: number;
}

export interface DemoDTO {
  id: string;
  leadId: string;
  studentName: string;
  course?: string;
  scheduledAt: string;
  mode: string;
  /** Null until someone marks it — unknown is not the same as did not attend. */
  attended: boolean | null;
  feedback?: string;
  awaitingMarking: boolean;
}

export interface DemoBoardDTO {
  from: string;
  to: string;
  demos: DemoDTO[];
  awaitingMarking: DemoDTO[];
  scheduled: number;
  attended: number;
  attendanceRate: number | null;
}

export interface NotificationDTO {
  id: string;
  kind: string;
  title: string;
  body?: string;
  leadId?: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationListDTO {
  items: NotificationDTO[];
  unread: number;
}

export interface SendPackSummaryDTO {
  key: string;
  name: string;
  situation: string;
}

export interface PreparedAssetDTO {
  key: string;
  name: string;
  type: string;
  url: string;
  sizeLabel?: string;
  tracked: boolean;
}

export interface PreparedPackDTO {
  packKey: string;
  packName: string;
  situation?: string;
  message: string;
  assets: PreparedAssetDTO[];
  /** Minutes of WhatsApp's free-reply window left; null once it has closed. */
  replyWindowMinutesLeft: number | null;
  freeReplyOpen: boolean;
  whatsappUrl: string | null;
  note: string;
  /** True when the swipe delivers to the student directly rather than opening WhatsApp. */
  sendsAutomatically: boolean;
  channel: string;
}

export interface SendOutcomeDTO {
  sent: boolean;
  status: string;
  detail: string;
  /** Set only when the channel cannot send itself and a person has to. */
  handoffUrl: string | null;
  channel: string;
}
