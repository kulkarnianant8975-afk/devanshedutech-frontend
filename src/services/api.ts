import axios from 'axios';
import { 
  WorkingHoursDTO,
  WhatsAppStatusDTO,
  WhatsAppTestDTO,
  GradeSuggestionDTO,
  HolidayDTO,
  DutyShiftDTO,
  CourseRequestDTO, 
  CourseResponseDTO, 
  LeadRequestDTO, 
  LeadDTO,
  LeadDetailDTO,
  LeadPatchDTO,
  LeadQueryParams,
  LeadOptionsDTO,
  MyDayDTO,
  OutcomeDTO,
  CaptureResponseDTO,
  LadderStepDTO,
  PipelineMetricsDTO,
  SendPackSummaryDTO,
  PreparedPackDTO,
  SendOutcomeDTO,
  ScriptsDTO,
  EditablePackDTO,
  BoardDTO,
  DemoDTO,
  DemoBoardDTO,
  NotificationListDTO,
  SegmentsDTO,
  BroadcastDTO,
  BatchDTO,
  GradeName,
  PageResponseDTO, 
  UserResponseDTO,
  HiringRequestDTO,
  HiringResponseDTO,
  TeamResponseDTO,
  StaffUserDTO,
  CreateUserDTO,
  AuditEntryDTO,
  RoleName
} from '../dtos';

export const backendUrl = import.meta.env.VITE_BACKEND_URL || '';

const api = axios.create({
  baseURL: backendUrl ? `${backendUrl}/api` : '/api',
  withCredentials: true, // Required for sessions
});

// For public requests that shouldn't send credentials (fixes potential 401 errors with broken cookies)
export const publicApi = axios.create({
  baseURL: backendUrl ? `${backendUrl}/api` : '/api',
  withCredentials: false,
});

export const courseService = {
  getAll: () => api.get<CourseResponseDTO[]>('/courses').then(res => res.data),
  /** One course by its URL name, for its landing page. Falls back to an id on the server. */
  getBySlug: (slug: string) =>
    api.get<CourseResponseDTO>(`/courses/slug/${slug}`).then(res => res.data),
  create: (course: CourseRequestDTO) => api.post<CourseResponseDTO>('/courses', course).then(res => res.data),
  update: (id: string, course: Partial<CourseRequestDTO>) => api.put<CourseResponseDTO>(`/courses/${id}`, course).then(res => res.data),
  delete: (id: string) => api.delete(`/courses/${id}`).then(res => res.data),
};

/**
 * The pipeline.
 *
 * `list` is paginated and filtered on the server; a counsellor's request is narrowed to their
 * own leads there, so the client never needs to filter for security reasons.
 */
export const leadService = {
  list: (params: LeadQueryParams = {}) =>
    api.get<PageResponseDTO<LeadDTO>>('/leads', { params }).then(res => res.data),
  detail: (id: string) => api.get<LeadDetailDTO>(`/leads/${id}`).then(res => res.data),
  myDay: (owner?: string) =>
    api.get<MyDayDTO>('/leads/my-day', { params: owner ? { owner } : {} }).then(res => res.data),
  options: () => api.get<LeadOptionsDTO>('/leads/options').then(res => res.data),
  board: (params: { owner?: string; grade?: GradeName; q?: string } = {}) =>
    api.get<BoardDTO>('/leads/board', { params }).then(res => res.data),

  create: (lead: LeadRequestDTO) =>
    api.post<CaptureResponseDTO>('/leads', lead).then(res => res.data),
  patch: (id: string, changes: LeadPatchDTO) =>
    api.patch<LeadDTO>(`/leads/${id}`, changes).then(res => res.data),
  recordOutcome: (id: string, outcome: OutcomeDTO) =>
    api.post<LeadDetailDTO>(`/leads/${id}/outcome`, outcome).then(res => res.data),
  addNote: (id: string, summary: string, detail?: string) =>
    api.post(`/leads/${id}/activity`, { summary, detail, type: 'NOTE' }).then(res => res.data),
  optOut: (id: string) => api.post<LeadDTO>(`/leads/${id}/opt-out`).then(res => res.data),

  /** Enrolment and referrals. */
  nextBatch: (id: string) =>
    api.get<{ id?: string; name?: string; startDate?: string; description?: string }>(
      `/leads/${id}/next-batch`).then(res => res.data),
  enrol: (id: string, batchId: string | undefined, feePlan: string, paymentStatus: string) =>
    api.post<LeadDTO>(`/leads/${id}/enrol`, { batchId, feePlan, paymentStatus }).then(res => res.data),

  /** Message packs: what is about to be sent, and recording that it was. */
  packs: () => api.get<SendPackSummaryDTO[]>('/leads/packs').then(res => res.data),
  scripts: () => api.get<ScriptsDTO>('/leads/packs/full').then(res => res.data),
  updatePack: (key: string, changes: Partial<EditablePackDTO>) =>
    api.patch<EditablePackDTO>(`/leads/packs/${key}`, changes).then(res => res.data),
  preparePack: (id: string, packKey: string) =>
    api.get<PreparedPackDTO>(`/leads/${id}/packs/${packKey}`).then(res => res.data),
  sendPack: (id: string, packKey: string, message: string, assets: string[]) =>
    api.post<SendOutcomeDTO>(`/leads/${id}/packs/${packKey}/send`, { message, assets })
       .then(res => res.data),
  recordPackSent: (id: string, packKey: string, assets: string[]) =>
    api.post<LeadDTO>(`/leads/${id}/packs/${packKey}/sent`, { assets }).then(res => res.data),

  /** Freezes the follow-up sequence without pretending the lead is lost. */
  pause: (id: string, until: string, reason?: string) =>
    api.post<LeadDTO>(`/leads/${id}/pause`, { until, reason }).then(res => res.data),
  resume: (id: string) => api.post<LeadDTO>(`/leads/${id}/resume`).then(res => res.data),

  ladderConfig: () => api.get<LadderStepDTO[]>('/leads/ladder').then(res => res.data),
  /** Runs the daily follow-up pass on demand. Idempotent for a given day. */
  runLadder: () => api.post<Record<string, number>>('/leads/ladder/run').then(res => res.data),
  updateLadderStep: (id: string, changes: { dayOffset?: number; title?: string; action?: string; active?: boolean }) =>
    api.patch<LadderStepDTO>(`/leads/ladder/${id}`, changes).then(res => res.data),

  /** Discouraged: the SOP marks a lead lost and keeps it, because they may return. */
  delete: (id: string) => api.delete(`/leads/${id}`).then(res => res.data),
  getStats: () => api.get('/stats').then(res => res.data),
  /** The six numbers, the funnel and source performance — all from one server-side calculation. */
  pipelineMetrics: (weeks = 8) =>
    api.get<PipelineMetricsDTO>('/stats/pipeline', { params: { weeks } }).then(res => res.data),
};

export const hiringService = {
  getAll: () => api.get<HiringResponseDTO[]>('/hiring').then(res => res.data),
  create: (post: HiringRequestDTO) => api.post<HiringResponseDTO>('/hiring', post).then(res => res.data),
  update: (id: string, post: Partial<HiringRequestDTO>) => api.put<HiringResponseDTO>(`/hiring/${id}`, post).then(res => res.data),
  delete: (id: string) => api.delete(`/hiring/${id}`).then(res => res.data),
};

/**
 * Staff administration. Every call here is authorised on the server; a 403 means the role is
 * not permitted, and the message from the server is written to be shown to the user as-is.
 */
export const userService = {
  getTeam: () => api.get<TeamResponseDTO>('/users').then(res => res.data),
  getAssignable: () => api.get<StaffUserDTO[]>('/users/assignable').then(res => res.data),
  create: (user: CreateUserDTO) => api.post<StaffUserDTO>('/users', user).then(res => res.data),
  update: (id: string, changes: { displayName?: string; phone?: string }) =>
    api.patch<StaffUserDTO>(`/users/${id}`, changes).then(res => res.data),
  changeRole: (id: string, role: RoleName, reason?: string) =>
    api.patch<StaffUserDTO>(`/users/${id}/role`, { role, reason }).then(res => res.data),
  setActive: (id: string, active: boolean, reason?: string) =>
    api.patch<StaffUserDTO>(`/users/${id}/active`, { active, reason }).then(res => res.data),
  resetPassword: (id: string, password: string) =>
    api.post(`/users/${id}/password`, { password }).then(res => res.data),
  getAudit: (page = 0, size = 100) =>
    api.get<AuditEntryDTO[]>('/users/audit', { params: { page, size } }).then(res => res.data),
};

/** Pulls the human-readable message out of an axios error, with a sane fallback. */
export const errorMessage = (err: any, fallback = 'Something went wrong. Please try again.'): string => {
  const data = err?.response?.data;
  if (typeof data === 'string' && data.trim()) return data;
  if (data?.message) return data.message;
  if (data?.error) return data.error;
  return err?.message || fallback;
};

/** Demo classes and campus visits. */
export const demoService = {
  board: (from?: string, to?: string) =>
    api.get<DemoBoardDTO>('/demos', { params: { from, to } }).then(res => res.data),
  book: (leadId: string, scheduledAt: string, mode?: string) =>
    api.post<DemoDTO>('/demos', { leadId, scheduledAt, mode }).then(res => res.data),
  mark: (id: string, attended: boolean, feedback?: string) =>
    api.post<DemoDTO>(`/demos/${id}/mark`, { attended, feedback }).then(res => res.data),
  cancel: (id: string, reason?: string) =>
    api.delete(`/demos/${id}`, { params: { reason } }).then(res => res.data),
};

/** Each person's own notifications. There is no path to anybody else's. */
export const notificationService = {
  list: (limit = 30) =>
    api.get<NotificationListDTO>('/notifications', { params: { limit } }).then(res => res.data),
  markRead: (id: string) => api.post(`/notifications/${id}/read`).then(res => res.data),
  markAllRead: () => api.post('/notifications/read-all').then(res => res.data),
};

/** Announcements to dormant leads. */
export const broadcastService = {
  segments: () => api.get<SegmentsDTO>('/broadcasts/segments').then(res => res.data),
  recent: () => api.get<BroadcastDTO[]>('/broadcasts').then(res => res.data),
  send: (title: string, message: string, segment: string) =>
    api.post<BroadcastDTO>('/broadcasts', { title, message, segment }).then(res => res.data),
};

/** Course intakes. */
export const batchService = {
  list: (upcomingOnly = false) =>
    api.get<BatchDTO[]>('/batches', { params: { upcomingOnly } }).then(res => res.data),
  create: (batch: Partial<BatchDTO>) => api.post<BatchDTO>('/batches', batch).then(res => res.data),
  update: (id: string, changes: Partial<BatchDTO>) =>
    api.patch<BatchDTO>(`/batches/${id}`, changes).then(res => res.data),
};

export const authService = {
  getMe: () => api.get<UserResponseDTO>('/auth/me').then(res => {
    console.log('Auth getMe response:', res.data);
    return res.data;
  }).catch(err => {
    console.error('Auth getMe error:', err.response?.status, err.response?.data);
    throw err;
  }),
  updateProfilePicture: (photoUrl: string) => api.put<UserResponseDTO>('/auth/profile-picture', { photoUrl }).then(res => res.data),
  login: (credentials: any) => api.post<UserResponseDTO>('/auth/login', credentials).then(res => res.data),
  register: (data: any) => api.post<UserResponseDTO>('/auth/register', data).then(res => res.data),
  logout: () => api.post('/auth/logout').then(res => res.data),
  loginWithGoogle: () => {
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    return window.open(
      `${backendUrl}/oauth2/authorization/google`,
      'google_oauth',
      `width=${width},height=${height},left=${left},top=${top}`
    );
  }
};

/**
 * Opening hours, closures, and the duty roster.
 *
 * These decide two things that used to be assumed: how long a student actually waited (counted
 * in opening hours rather than wall clock) and who owns an enquiry the moment it arrives.
 */
/**
 * The counsellor's assistant.
 *
 * Everything here suggests; nothing here decides. A grade comes back for a person to accept or
 * ignore, and a draft comes back for a person to edit and send.
 */
export const assistantService = {
  available: (leadId: string) =>
    api.get<{ available: boolean }>(`/leads/${leadId}/ai/available`).then(res => res.data.available),
  suggestGrade: (leadId: string) =>
    api.post<GradeSuggestionDTO>(`/leads/${leadId}/ai/grade`).then(res => res.data),
  summarise: (leadId: string) =>
    api.post<{ summary: string }>(`/leads/${leadId}/ai/summary`).then(res => res.data.summary),
  draft: (leadId: string, intent?: string) =>
    api.post<{ draft: string }>(`/leads/${leadId}/ai/draft`, { intent }).then(res => res.data.draft),
};

export const scheduleService = {
  getHours: () => api.get<WorkingHoursDTO[]>('/schedule/hours').then(res => res.data),
  setHours: (week: WorkingHoursDTO[]) =>
    api.put<WorkingHoursDTO[]>('/schedule/hours', week).then(res => res.data),

  getHolidays: () => api.get<HolidayDTO[]>('/schedule/holidays').then(res => res.data),
  addHoliday: (day: string, name: string) =>
    api.post<HolidayDTO>('/schedule/holidays', { day, name }).then(res => res.data),
  removeHoliday: (day: string) => api.delete(`/schedule/holidays/${day}`).then(res => res.data),

  getRoster: () => api.get<DutyShiftDTO[]>('/schedule/roster').then(res => res.data),
  addShift: (shift: { userId: string; day: string; startsAt: string; endsAt: string }) =>
    api.post<DutyShiftDTO>('/schedule/roster', shift).then(res => res.data),
  removeShift: (id: string) => api.delete(`/schedule/roster/${id}`).then(res => res.data),

  onDutyNow: () => api.get<{ userId?: string; name?: string }>('/schedule/on-duty').then(res => res.data),
};

/**
 * Proving the WhatsApp connection works before a student is on the other end.
 *
 * The failure modes — an expired token, a number not on the allowed list — are invisible until
 * a message does not arrive, and by then it has not arrived for somebody who matters.
 */
export const whatsappService = {
  status: () => api.get<WhatsAppStatusDTO>('/settings/whatsapp/status').then(res => res.data),
  sendTemplate: (phone: string) =>
    api.post<WhatsAppTestDTO>('/settings/whatsapp/test', { phone }).then(res => res.data),
  sendMessage: (phone: string) =>
    api.post<WhatsAppTestDTO>('/settings/whatsapp/test-message', { phone }).then(res => res.data),
};

export const settingsService = {
  getBrochure: () => api.get<{downloadUrl: string}>('/public/brochure').then(res => res.data),
  uploadBrochure: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/settings/brochure/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data);
  },
  getCourseBrochure: (courseId: string) => api.get<{downloadUrl: string}>(`/public/brochure/${courseId}`).then(res => res.data),
  uploadCourseBrochure: (courseId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/settings/brochure/upload/${courseId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data);
  },
};

export default api;
