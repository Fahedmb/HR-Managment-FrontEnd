// ===================== USER =====================
export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  position: string;
  department: string;
  role: 'HR' | 'EMPLOYEE' | 'MANAGER';
  usedDaysThisYear: number;
  leaveBalance?: number;
  createdAt: string;
  updatedAt: string;
}

// ===================== AUTH =====================
export interface AuthResponse {
  token: string;
  messageResponse: string;
  user: User;
}

// ===================== LEAVE =====================
export type LeaveType = 'VACATION' | 'SICK' | 'PERSONAL' | 'MATERNITY' | 'PATERNITY' | 'EMERGENCY' | 'UNPAID' | 'OTHER';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'PENDING_CANCELLATION';

export interface LeaveRequest {
  id: number;
  userId: number;
  userEmail: string;
  username: string;
  firstName: string;
  lastName: string;
  startDate: string;
  endDate: string;
  type: LeaveType;
  status: LeaveStatus;
  reason: string;
  halfDay: boolean;
  daysCount: number;
  approvedById?: number;
  approvedByName?: string;
  approverComment?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

// ===================== TIMESHEET =====================
export type ScheduleStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type DayOfWeekEnum = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export interface TimeSheet {
  id: number;
  scheduleId: number;
  dayOfWeek: DayOfWeekEnum;
  startTime: string;
  endTime: string;
  totalHours: number;
}

export interface TimesheetSchedule {
  id: number;
  userId: number;
  chosenDays: DayOfWeekEnum[];
  startTime: string;           // "HH:mm:ss"
  hoursPerDay: number;
  totalHoursPerWeek: number;
  status: ScheduleStatus;
  createdAt: string;
  updatedAt: string;
  userEmail?: string;
}

// ===================== PROJECTS =====================
export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';

export interface Project {
  id: number;
  name: string;
  description: string;
  department: string;
  status: ProjectStatus;
  startDate: string;
  deadline: string;
  createdById: number;
  createdByName: string;
  totalTasks: number;
  completedTasks: number;
  createdAt: string;
  updatedAt: string;
}

// ===================== TEAMS =====================
export type TeamMemberRole = 'MEMBER' | 'LEADER';

export interface TeamMember {
  id: number;
  teamId: number;
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  role: TeamMemberRole;
  joinedAt: string;
}

export interface Team {
  id: number;
  name: string;
  description: string;
  projectId: number;
  projectName: string;
  teamLeaderId?: number;
  teamLeaderName?: string;
  members: TeamMember[];
  createdAt: string;
  updatedAt: string;
}

// ===================== TASKS =====================
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface TaskComment {
  id: number;
  taskId: number;
  authorId: number;
  authorName: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  projectId: number;
  projectName: string;
  teamId?: number;
  teamName?: string;
  assignedToId?: number;
  assignedToName?: string;
  createdById: number;
  createdByName: string;
  status: TaskStatus;
  priority: TaskPriority;
  deadline: string;
  estimatedHours: number;
  actualHours: number;
  comments: TaskComment[];
  createdAt: string;
  updatedAt: string;
}

// ===================== MEETINGS =====================
export type MeetingStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface Meeting {
  id: number;
  title: string;
  description: string;
  organizerId: number;
  organizerName: string;
  attendeeIds: number[];
  attendees: User[];
  startTime: string;
  endTime: string;
  location?: string;
  meetingLink?: string;
  status: MeetingStatus;
  createdAt: string;
}

// ===================== NOTIFICATIONS =====================
export type NotificationType =
  | 'LEAVE_REQUEST_SUBMITTED' | 'LEAVE_REQUEST_APPROVED' | 'LEAVE_REQUEST_REJECTED'
  | 'LEAVE_REQUEST_CANCELLED' | 'LEAVE_CANCELLATION_REQUESTED'
  | 'SCHEDULE_SUBMITTED' | 'SCHEDULE_APPROVED' | 'SCHEDULE_REJECTED' | 'SCHEDULE_UPDATED'
  | 'TASK_ASSIGNED' | 'TASK_STATUS_CHANGED' | 'TASK_COMMENTED' | 'TASK_DEADLINE_APPROACHING'
  | 'PROJECT_ASSIGNED' | 'PROJECT_UPDATED'
  | 'TEAM_MEMBER_ADDED' | 'TEAM_MEMBER_REMOVED'
  | 'MEETING_SCHEDULED' | 'MEETING_UPDATED' | 'MEETING_CANCELLED' | 'MEETING_REMINDER'
  | 'CHAT_MESSAGE' | 'PERFORMANCE_REVIEW' | 'USER_UPDATED'
  | 'REMINDER' | 'ANNOUNCEMENT' | 'GENERIC';

export interface Notification {
  id: number;
  recipientId: number;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
}

// ===================== CHAT =====================
export type MessageType = 'DIRECT' | 'TEAM';

export interface ChatMessage {
  id: number;
  messageType: MessageType;
  senderId: number;
  senderName: string;
  recipientId?: number;
  teamId?: number;
  content: string;
  readByIds: number[];
  seen: boolean;
  createdAt: string;
}

// ===================== KPI =====================
export interface HrKpiDashboard {
  totalEmployees: number;
  totalHrUsers: number;
  totalManagers: number;
  departmentBreakdown: Record<string, number>;
  totalLeaveRequestsThisYear: number;
  pendingLeaveRequests: number;
  approvedLeaveRequests: number;
  rejectedLeaveRequests: number;
  leaveByType: Record<string, number>;
  avgLeaveDaysPerEmployee: number;
  totalSchedulesSubmitted: number;
  approvedSchedules: number;
  pendingSchedules: number;
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  overdueProjects: number;
  projectsByStatus: Record<string, number>;
  projectsByDepartment: Record<string, number>;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  taskCompletionRate: number;
  tasksByStatus: Record<string, number>;
  totalTeams: number;
  totalMeetings: number;
  upcomingMeetings: number;
  completedMeetings: number;
  avgPerformanceScore: number;
  evaluationsThisYear: number;
}

export interface EmployeeKpiDashboard {
  employeeName: string;
  department: string;
  position: string;
  myTotalTasks: number;
  myCompletedTasks: number;
  myInProgressTasks: number;
  myOverdueTasks: number;
  myLeaveBalance: number;
  myUsedLeaveDays: number;
  myPendingLeaveRequests: number;
  myTeams: string[];
  myProjects: string[];
  myMeetingsThisMonth: number;
  myPerformanceScore: number;
}

export interface ProjectKpiDashboard {
  projectName: string;
  projectStatus: ProjectStatus;
  projectDeadline: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  overdueTasks: number;
  taskCompletionRate: number;
  tasksByPriority: Record<string, number>;
  tasksByAssignee: Record<string, number>;
  totalTeamMembers: number;
  totalMeetings: number;
}

// ===================== PERFORMANCE =====================
export interface PerformanceEvaluation {
  id: number;
  employeeId: number;
  reviewerId: number;
  period: string;
  score: number;
  comments: string;
  createdAt: string;
}
