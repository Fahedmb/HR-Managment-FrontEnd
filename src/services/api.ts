import api from '../util/axiosConfig';
import type {
  AuthResponse,
  User,
  LeaveRequest,
  TimesheetSchedule,
  Project,
  Team,
  Task,
  Meeting,
  Notification,
  ChatMessage,
  HrKpiDashboard,
  EmployeeKpiDashboard,
  ProjectKpiDashboard,
} from '../types';

// ====== AUTH ======
export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/authenticate', { email, password }),
  register: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    position: string;
    department: string;
    role?: string;
  }) => api.post<AuthResponse>('/auth/register', data),
};

// ====== USERS ======
export const usersApi = {
  getAll: () => api.get<User[]>('/api/users'),
  getById: (id: number) => api.get<User>(`/api/users/${id}`),
  getByDepartment: (department: string) => api.get<User[]>(`/api/users/department/${department}`),
  getByRole: (role: string) => api.get<User[]>(`/api/users/role/${role}`),
  update: (id: number, data: Partial<User>) => api.put<User>(`/api/users/${id}`, data),
  changeRole: (id: number, role: string) => api.patch<User>(`/api/users/${id}/role`, { role }),
  resetPassword: (id: number, newPassword: string) =>
    api.patch(`/api/users/${id}/reset-password`, { newPassword }),
  delete: (id: number) => api.delete(`/api/users/${id}`),
};

// ====== LEAVE REQUESTS ======
export const leaveApi = {
  getAll: () => api.get<LeaveRequest[]>('/api/leave-requests'),
  getById: (id: number) => api.get<LeaveRequest>(`/api/leave-requests/${id}`),
  getByUser: (userId: number) => api.get<LeaveRequest[]>(`/api/leave-requests/user/${userId}`),
  getBalance: () => api.get<{ balance: number }>('/api/leave-requests/balance'),
  create: (data: Partial<LeaveRequest>) => api.post<LeaveRequest>('/api/leave-requests', data),
  update: (id: number, data: Partial<LeaveRequest>) =>
    api.put<LeaveRequest>(`/api/leave-requests/${id}`, data),
  updateStatus: (
    id: number,
    status: string,
    approvedById: number,
    approverComment?: string
  ) =>
    api.put(`/api/leave-requests/${id}/status`, { status, approvedById, approverComment }),
  cancel: (id: number, reason: string) =>
    api.patch(`/api/leave-requests/${id}/cancel`, { reason }),
  delete: (id: number) => api.delete(`/api/leave-requests/${id}`),
};

// ====== TIMESHEET SCHEDULES ======
export const timesheetApi = {
  getAll: () => api.get<TimesheetSchedule[]>('/api/timesheet-schedules'),
  getById: (id: number) => api.get<TimesheetSchedule>(`/api/timesheet-schedules/${id}`),
  getByUser: (userId: number) =>
    api.get<TimesheetSchedule[]>(`/api/timesheet-schedules/user/${userId}`),
  create: (data: Partial<TimesheetSchedule>) =>
    api.post<TimesheetSchedule>('/api/timesheet-schedules', data),
  update: (id: number, data: Partial<TimesheetSchedule>) =>
    api.put<TimesheetSchedule>(`/api/timesheet-schedules/${id}`, data),
  updateStatus: (id: number, status: string) =>
    api.patch(`/api/timesheet-schedules/${id}/status`, { status }),
  delete: (id: number) => api.delete(`/api/timesheet-schedules/${id}`),
};

// ====== PROJECTS ======
export const projectsApi = {
  getAll: () => api.get<Project[]>('/api/projects'),
  getById: (id: number) => api.get<Project>(`/api/projects/${id}`),
  getByDepartment: (dept: string) => api.get<Project[]>(`/api/projects/department/${dept}`),
  getCreatedBy: (userId: number) => api.get<Project[]>(`/api/projects/created-by/${userId}`),
  create: (createdById: number, data: Partial<Project>) =>
    api.post<Project>(`/api/projects?createdById=${createdById}`, data),
  update: (id: number, data: Partial<Project>) => api.put<Project>(`/api/projects/${id}`, data),
  updateStatus: (id: number, status: string) =>
    api.patch(`/api/projects/${id}/status`, { status }),
  delete: (id: number) => api.delete(`/api/projects/${id}`),
};

// ====== TEAMS ======
export const teamsApi = {
  getAll: () => api.get<Team[]>('/api/teams'),
  getById: (id: number) => api.get<Team>(`/api/teams/${id}`),
  getByProject: (projectId: number) => api.get<Team[]>(`/api/teams/project/${projectId}`),
  getByLeader: (leaderId: number) => api.get<Team[]>(`/api/teams/leader/${leaderId}`),
  create: (createdByHrId: number, data: Partial<Team>) =>
    api.post<Team>(`/api/teams?createdByHrId=${createdByHrId}`, data),
  update: (id: number, data: Partial<Team>) => api.put<Team>(`/api/teams/${id}`, data),
  delete: (id: number) => api.delete(`/api/teams/${id}`),
  getMembers: (teamId: number) => api.get(`/api/teams/${teamId}/members`),
  addMember: (teamId: number, userId: number) =>
    api.post(`/api/teams/${teamId}/members/${userId}`),
  removeMember: (teamId: number, userId: number) =>
    api.delete(`/api/teams/${teamId}/members/${userId}`),
  assignLeader: (teamId: number, userId: number) =>
    api.patch(`/api/teams/${teamId}/leader/${userId}`),
};

// ====== TASKS ======
export const tasksApi = {
  getAll: () => api.get<Task[]>('/api/tasks'),
  getById: (id: number) => api.get<Task>(`/api/tasks/${id}`),
  getByProject: (projectId: number) => api.get<Task[]>(`/api/tasks/project/${projectId}`),
  getByTeam: (teamId: number) => api.get<Task[]>(`/api/tasks/team/${teamId}`),
  getByAssignee: (userId: number) => api.get<Task[]>(`/api/tasks/assignee/${userId}`),
  create: (data: Partial<Task>) => api.post<Task>('/api/tasks', data),
  update: (id: number, data: Partial<Task>) => api.put<Task>(`/api/tasks/${id}`, data),
  updateStatus: (id: number, status: string, updatedByUserId: number) =>
    api.patch(`/api/tasks/${id}/status?updatedByUserId=${updatedByUserId}`, { status }),
  delete: (id: number) => api.delete(`/api/tasks/${id}`),
  getComments: (taskId: number) => api.get(`/api/tasks/${taskId}/comments`),
  addComment: (taskId: number, authorId: number, content: string) =>
    api.post(`/api/tasks/${taskId}/comments?authorId=${authorId}`, { content }),
  deleteComment: (commentId: number) => api.delete(`/api/tasks/comments/${commentId}`),
};

// ====== MEETINGS ======
export const meetingsApi = {
  getAll: () => api.get<Meeting[]>('/api/meetings'),
  getById: (id: number) => api.get<Meeting>(`/api/meetings/${id}`),
  getByUser: (userId: number) => api.get<Meeting[]>(`/api/meetings/user/${userId}`),
  getByOrganizer: (organizerId: number) =>
    api.get<Meeting[]>(`/api/meetings/organizer/${organizerId}`),
  create: (data: Partial<Meeting>) => api.post<Meeting>('/api/meetings', data),
  update: (id: number, data: Partial<Meeting>) =>
    api.put<Meeting>(`/api/meetings/${id}`, data),
  cancel: (id: number) => api.patch(`/api/meetings/${id}/cancel`),
  delete: (id: number) => api.delete(`/api/meetings/${id}`),
};

// ====== NOTIFICATIONS ======
export const notificationsApi = {
  getByUser: (userId: number) =>
    api.get<Notification[]>(`/api/notifications/${userId}`),
  getUnreadCount: (userId: number) =>
    api.get<{ count: number }>(`/api/notifications/${userId}/unread-count`),
  create: (data: { recipientId: string; message: string; type: string }) =>
    api.post<Notification>('/api/notifications', data),
  markRead: (id: number) => api.patch(`/api/notifications/${id}/read`),
  markAllRead: (userId: number) =>
    api.patch(`/api/notifications/user/${userId}/read-all`),
  delete: (id: number) => api.delete(`/api/notifications/${id}`),
};

// ====== CHAT ======
export const chatApi = {
  getConversation: (userId1: number, userId2: number) =>
    api.get<ChatMessage[]>(`/api/chat/conversation/${userId1}/${userId2}`),
  getTeamChannel: (teamId: number) =>
    api.get<ChatMessage[]>(`/api/chat/team/${teamId}`),
  send: (data: Partial<ChatMessage>) => api.post<ChatMessage>('/api/chat/send', data),
  markMessageRead: (messageId: number, readerId: number) =>
    api.patch(`/api/chat/${messageId}/read/${readerId}`),
  markConversationRead: (senderId: number, recipientId: number) =>
    api.patch(`/api/chat/conversation/${senderId}/${recipientId}/read`),
  markTeamChannelRead: (teamId: number, userId: number) =>
    api.patch(`/api/chat/team/${teamId}/read/${userId}`),
};

// ====== KPI ======
export const kpiApi = {
  getHr: () => api.get<HrKpiDashboard>('/api/kpi/hr'),
  getProject: (projectId: number) =>
    api.get<ProjectKpiDashboard>(`/api/kpi/project/${projectId}`),
  getEmployee: (userId: number) =>
    api.get<EmployeeKpiDashboard>(`/api/kpi/employee/${userId}`),
};

// ====== PERFORMANCE ======
export const performanceApi = {
  getAll: () => api.get('/api/performance-evaluations'),
  getById: (id: number) => api.get(`/api/performance-evaluations/${id}`),
  create: (data: object) => api.post('/api/performance-evaluations', data),
  update: (id: number, data: object) => api.put(`/api/performance-evaluations/${id}`, data),
  delete: (id: number) => api.delete(`/api/performance-evaluations/${id}`),
};
