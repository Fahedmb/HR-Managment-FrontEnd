# HR Management Backend — Full Blueprint

> **Stack**: Spring Boot 3.5.11 · Java 17 · MySQL · Spring Security + JWT · Spring WebSocket (STOMP/SockJS) · Lombok · Thymeleaf (email)
> **Base package**: `com.react.project` · **Port**: `9090`

---

## Table of Contents
1. [Authentication Flow](#1-authentication-flow)
2. [Database Schema](#2-database-schema)
3. [Enum Reference](#3-enum-reference)
4. [REST API Reference](#4-rest-api-reference)
5. [WebSocket Reference](#5-websocket-reference)
6. [Notification System](#6-notification-system)
7. [Email Templates](#7-email-templates)
8. [Security Configuration](#8-security-configuration)
9. [KPI Dashboard Fields](#9-kpi-dashboard-fields)
10. [Project Package Structure](#10-project-package-structure)

---

## 1. Authentication Flow

### Register
```
POST /auth/register
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane.doe@example.com",
  "password": "secret",
  "position": "Developer",
  "department": "Engineering",
  "role": "EMPLOYEE"          // optional; defaults to EMPLOYEE
}
```
**Response**:
```json
{
  "messageResponse": "User registered successfully",
  "token": "<jwt>",
  "user": { ...UserDTO }
}
```
- Username is **auto-derived** as `firstname.lastname` (lower-case, e.g. `jane.doe`). A numeric suffix is appended on collision.
- A welcome email is sent to the registered address.
- The JWT token is returned so the frontend can immediately authenticate.

### Login
```
POST /auth/authenticate
Content-Type: application/json

{
  "email": "jane.doe@example.com",
  "password": "secret"
}
```
**Response**: `{ "token": "<jwt>", "messageResponse": "...", "user": { ...UserDTO } }`

### Using the Token
All protected endpoints require:
```
Authorization: Bearer <jwt>
```
The JWT payload contains:
| Claim | Value |
|-------|-------|
| `sub` | user email |
| `role` | e.g. `HR` / `EMPLOYEE` / `MANAGER` |
| `username` | derived username |

Token validity: **1 hour**.

---

## 2. Database Schema

### `users`
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT PK AI | |
| username | VARCHAR UNIQUE | auto-derived |
| email | VARCHAR UNIQUE | login principal |
| password | VARCHAR | BCrypt |
| first_name | VARCHAR | |
| last_name | VARCHAR | |
| position | VARCHAR | |
| department | VARCHAR | |
| role | ENUM(Role) | |
| used_days_this_year | INT | default 0 |
| created_at | DATETIME | |
| updated_at | DATETIME | |

---

### `leave_requests`
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT PK AI | |
| user_id | FK → users | requester |
| approved_by_id | FK → users | nullable |
| start_date | DATE | |
| end_date | DATE | |
| type | ENUM(LeaveType) | |
| status | ENUM(LeaveStatus) | default PENDING |
| reason | TEXT | |
| approver_comment | TEXT | nullable |
| cancellation_reason | TEXT | nullable |
| half_day | BOOLEAN | |
| created_at | DATETIME | |
| updated_at | DATETIME | |

---

### `timesheet_schedules`
| Column | Type |
|--------|------|
| id | BIGINT PK AI |
| user_id | FK → users |
| week_start | DATE |
| status | ENUM(ScheduleStatus) |
| created_at | DATETIME |
| updated_at | DATETIME |

### `time_sheets`
| Column | Type |
|--------|------|
| id | BIGINT PK AI |
| schedule_id | FK → timesheet_schedules |
| day_of_week | ENUM(DayOfWeekEnum) |
| start_time | TIME |
| end_time | TIME |
| total_hours | DECIMAL |

---

### `projects`
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT PK AI | |
| name | VARCHAR | |
| description | TEXT | |
| department | VARCHAR | |
| status | ENUM(ProjectStatus) | default PLANNING |
| start_date | DATE | |
| deadline | DATE | |
| created_by_id | FK → users | HR who created it |
| created_at | DATETIME | |
| updated_at | DATETIME | |

---

### `teams`
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT PK AI | |
| name | VARCHAR | |
| description | TEXT | |
| project_id | FK → projects | |
| team_leader_id | FK → users | nullable |
| created_at | DATETIME | |
| updated_at | DATETIME | |

---

### `team_members`
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT PK AI | |
| team_id | FK → teams | UNIQUE(team_id, user_id) |
| user_id | FK → users | |
| role | ENUM(TeamMemberRole) | MEMBER / LEADER |
| joined_at | DATETIME | |

---

### `tasks`
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT PK AI | |
| title | VARCHAR | |
| description | TEXT | |
| project_id | FK → projects | |
| team_id | FK → teams | nullable |
| assigned_to_id | FK → users | nullable |
| created_by_id | FK → users | |
| status | ENUM(TaskStatus) | default TODO |
| priority | ENUM(TaskPriority) | default MEDIUM |
| deadline | DATE | |
| estimated_hours | DECIMAL | |
| actual_hours | DECIMAL | |
| created_at | DATETIME | |
| updated_at | DATETIME | |

---

### `task_comments`
| Column | Type |
|--------|------|
| id | BIGINT PK AI |
| task_id | FK → tasks |
| author_id | FK → users |
| content | TEXT |
| created_at | DATETIME |
| updated_at | DATETIME |

---

### `meetings`
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT PK AI | |
| title | VARCHAR | |
| description | TEXT | |
| organizer_id | FK → users | HR or manager |
| start_time | DATETIME | |
| end_time | DATETIME | |
| location | VARCHAR | nullable |
| meeting_link | VARCHAR | nullable |
| status | ENUM(MeetingStatus) | default SCHEDULED |
| created_at | DATETIME | |

### `meeting_attendees` (join table)
| Column | Type |
|--------|------|
| meeting_id | FK → meetings |
| user_id | FK → users |

---

### `chat_messages`
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT PK AI | |
| message_type | VARCHAR | `DIRECT` or `TEAM` |
| sender_id | FK → users | |
| recipient_id | FK → users | nullable (DIRECT only) |
| team_id | FK → teams | nullable (TEAM only) |
| content | TEXT | |
| created_at | DATETIME | |

### `chat_message_read_by` (join table)
| Column | Type |
|--------|------|
| message_id | FK → chat_messages |
| user_id | FK → users |

---

### `notifications`
| Column | Type |
|--------|------|
| id | BIGINT PK AI |
| recipient_id | FK → users |
| message | TEXT |
| type | ENUM(NotificationType) |
| is_read | BOOLEAN default false |
| created_at | DATETIME |

---

### `performance_evaluations`
| Column | Type |
|--------|------|
| id | BIGINT PK AI |
| employee_id | FK → users |
| reviewer_id | FK → users |
| period | VARCHAR |
| score | INT |
| comments | TEXT |
| created_at | DATETIME |

---

## 3. Enum Reference

### `Role`
`HR` · `EMPLOYEE` · `MANAGER`

### `LeaveType`
`VACATION` · `SICK` · `PERSONAL` · `MATERNITY` · `PATERNITY` · `EMERGENCY` · `UNPAID` · `OTHER`

### `LeaveStatus`
`PENDING` · `APPROVED` · `REJECTED` · `CANCELLED` · `PENDING_CANCELLATION`

### `ProjectStatus`
`PLANNING` · `ACTIVE` · `ON_HOLD` · `COMPLETED` · `CANCELLED`

### `TaskStatus`
`TODO` · `IN_PROGRESS` · `IN_REVIEW` · `DONE` · `BLOCKED`

### `TaskPriority`
`LOW` · `MEDIUM` · `HIGH` · `CRITICAL`

### `MeetingStatus`
`SCHEDULED` · `IN_PROGRESS` · `COMPLETED` · `CANCELLED`

### `TeamMemberRole`
`MEMBER` · `LEADER`

### `NotificationType`
`LEAVE_REQUEST_SUBMITTED` · `LEAVE_REQUEST_APPROVED` · `LEAVE_REQUEST_REJECTED` · `LEAVE_REQUEST_CANCELLED` · `LEAVE_CANCELLATION_REQUESTED`  
`SCHEDULE_SUBMITTED` · `SCHEDULE_APPROVED` · `SCHEDULE_REJECTED` · `SCHEDULE_UPDATED`  
`TASK_ASSIGNED` · `TASK_STATUS_CHANGED` · `TASK_COMMENTED` · `TASK_DEADLINE_APPROACHING`  
`PROJECT_ASSIGNED` · `PROJECT_UPDATED`  
`TEAM_MEMBER_ADDED` · `TEAM_MEMBER_REMOVED`  
`MEETING_SCHEDULED` · `MEETING_UPDATED` · `MEETING_CANCELLED` · `MEETING_REMINDER`  
`CHAT_MESSAGE`  
`PERFORMANCE_REVIEW`  
`USER_UPDATED`  
`REMINDER` · `ANNOUNCEMENT` · `GENERIC`

### `DayOfWeekEnum`
`MONDAY` · `TUESDAY` · `WEDNESDAY` · `THURSDAY` · `FRIDAY` · `SATURDAY` · `SUNDAY`

---

## 4. REST API Reference

> All endpoints except `/auth/**` and `/ws/**` are authenticated via JWT Bearer.  
> `[HR]` = requires `ROLE_HR` (`@PreAuthorize("hasRole('HR')")`).

---

### Auth — `/auth`
| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | `RegisterRequest` | Register new user; returns JWT |
| POST | `/auth/authenticate` | `AuthenticationRequest` | Login; returns JWT |

---

### Users — `/api/users`
| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/users` | [HR] Get all users |
| GET | `/api/users/{id}` | Get user by ID |
| GET | `/api/users/department/{department}` | [HR] Filter by department |
| GET | `/api/users/role/{role}` | [HR] Filter by role |
| PUT | `/api/users/{id}` | Update profile (name, position, department) |
| PATCH | `/api/users/{id}/role` | [HR] Change role; body: `{ "role": "MANAGER" }` |
| PATCH | `/api/users/{id}/reset-password` | [HR] Reset password; body: `{ "newPassword": "..." }` |
| DELETE | `/api/users/{id}` | [HR] Delete user |

---

### Leave Requests — `/api/leave-requests`
| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/leave-requests` | All leave requests |
| GET | `/api/leave-requests/{id}` | By ID |
| GET | `/api/leave-requests/user/{userId}` | By employee |
| GET | `/api/leave-requests/balance` | Remaining days for current user (JWT) |
| POST | `/api/leave-requests` | Submit new request |
| PUT | `/api/leave-requests/{id}` | Update request (employee) |
| PUT | `/api/leave-requests/{id}/status` | [HR] Approve/Reject; body: `{ "status": "APPROVED", "approvedById": 1, "approverComment": "..." }` |
| PATCH | `/api/leave-requests/{id}/cancel` | Cancel; body: `{ "reason": "..." }` |
| DELETE | `/api/leave-requests/{id}` | Delete |

**`LeaveRequestDTO` fields**: `id`, `userId`, `userEmail`, `username`, `firstName`, `lastName`, `startDate`, `endDate`, `type`, `status`, `reason`, `halfDay`, `daysCount`, `approvedById`, `approvedByName`, `approverComment`, `cancellationReason`, `createdAt`, `updatedAt`

---

### Timesheet Schedule — `/api/timesheet-schedules` & `/api/time-sheets`
(unchanged from original; manages weekly work schedule submission and approval)

---

### Projects — `/api/projects`
| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/projects` | All projects |
| GET | `/api/projects/{id}` | By ID |
| GET | `/api/projects/department/{department}` | Filter by department |
| GET | `/api/projects/created-by/{userId}` | Created by specific HR/user |
| POST | `/api/projects?createdById={id}` | [HR] Create project |
| PUT | `/api/projects/{id}` | Update project |
| PATCH | `/api/projects/{id}/status` | Update status; body: `{ "status": "ACTIVE" }` |
| DELETE | `/api/projects/{id}` | [HR] Delete |

**`ProjectDTO` fields**: `id`, `name`, `description`, `department`, `status`, `startDate`, `deadline`, `createdById`, `createdByName`, `totalTasks`, `completedTasks`, `createdAt`, `updatedAt`

---

### Teams — `/api/teams`
| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/teams` | All teams |
| GET | `/api/teams/{id}` | By ID (includes members) |
| GET | `/api/teams/project/{projectId}` | Teams in a project |
| GET | `/api/teams/leader/{leaderId}` | Teams led by user |
| POST | `/api/teams?createdByHrId={id}` | [HR] Create team |
| PUT | `/api/teams/{id}` | Update team |
| DELETE | `/api/teams/{id}` | [HR] Delete |
| GET | `/api/teams/{teamId}/members` | List members |
| POST | `/api/teams/{teamId}/members/{userId}` | [HR] Add member |
| DELETE | `/api/teams/{teamId}/members/{userId}` | [HR] Remove member |
| PATCH | `/api/teams/{teamId}/leader/{userId}` | [HR] Assign team leader |

**`TeamDTO` fields**: `id`, `name`, `description`, `projectId`, `projectName`, `teamLeaderId`, `teamLeaderName`, `members: List<TeamMemberDTO>`, `createdAt`, `updatedAt`  
**`TeamMemberDTO` fields**: `id`, `teamId`, `userId`, `firstName`, `lastName`, `email`, `position`, `role`, `joinedAt`

---

### Tasks — `/api/tasks`
| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/tasks` | All tasks |
| GET | `/api/tasks/{id}` | By ID (includes comments) |
| GET | `/api/tasks/project/{projectId}` | Tasks in project |
| GET | `/api/tasks/team/{teamId}` | Tasks in team |
| GET | `/api/tasks/assignee/{userId}` | Tasks assigned to user |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/{id}` | Update task |
| PATCH | `/api/tasks/{id}/status?updatedByUserId={id}` | Update status; body: `{ "status": "IN_PROGRESS" }` |
| DELETE | `/api/tasks/{id}` | Delete |
| GET | `/api/tasks/{taskId}/comments` | Get comments |
| POST | `/api/tasks/{taskId}/comments?authorId={id}` | Add comment; body: `{ "content": "..." }` |
| DELETE | `/api/tasks/comments/{commentId}` | Delete comment |

**`TaskDTO` fields**: `id`, `title`, `description`, `projectId`, `projectName`, `teamId`, `teamName`, `assignedToId`, `assignedToName`, `createdById`, `createdByName`, `status`, `priority`, `deadline`, `estimatedHours`, `actualHours`, `comments: List<TaskCommentDTO>`, `createdAt`, `updatedAt`

---

### Meetings — `/api/meetings`
| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/meetings` | All meetings |
| GET | `/api/meetings/{id}` | By ID |
| GET | `/api/meetings/user/{userId}` | All meetings for user (organizer or attendee) |
| GET | `/api/meetings/organizer/{organizerId}` | Organized by user |
| POST | `/api/meetings` | [HR] Create meeting |
| PUT | `/api/meetings/{id}` | [HR] Update meeting |
| PATCH | `/api/meetings/{id}/cancel` | [HR] Cancel meeting |
| DELETE | `/api/meetings/{id}` | [HR] Delete |

**`MeetingDTO` fields**: `id`, `title`, `description`, `organizerId`, `organizerName`, `attendeeIds: List<Long>`, `attendees: List<UserDTO>`, `startTime`, `endTime`, `location`, `meetingLink`, `status`, `createdAt`

---

### Notifications — `/api/notifications`
| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/notifications/{userId}` | All notifications for user |
| GET | `/api/notifications/{userId}/unread-count` | `{ "count": N }` |
| POST | `/api/notifications` | Manual notification; body: `{ "recipientId": "1", "message": "...", "type": "GENERIC" }` |
| PATCH | `/api/notifications/{id}/read` | Mark one as read |
| PATCH | `/api/notifications/user/{userId}/read-all` | Mark all as read |
| DELETE | `/api/notifications/{id}` | Delete |

**`NotificationDTO` fields**: `id`, `recipientId`, `message`, `type`, `read`, `createdAt`

---

### Chat (REST) — `/api/chat`
| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/chat/conversation/{userId1}/{userId2}` | DM history |
| GET | `/api/chat/team/{teamId}` | Team channel history |
| POST | `/api/chat/send` | Send message (REST fallback) |
| PATCH | `/api/chat/{messageId}/read/{readerId}` | Mark message as read |
| PATCH | `/api/chat/conversation/{senderId}/{recipientId}/read` | Mark DM conversation as read |
| PATCH | `/api/chat/team/{teamId}/read/{userId}` | Mark team channel as read |

**`ChatMessageDTO` fields**: `id`, `messageType` (`DIRECT`/`TEAM`), `senderId`, `senderName`, `recipientId`, `teamId`, `content`, `readByIds: List<Long>`, `seen` (computed: contains current user), `createdAt`

---

### KPI Dashboards — `/api/kpi`
| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/kpi/hr` | [HR] Full org dashboard |
| GET | `/api/kpi/project/{projectId}` | Project/team-leader dashboard |
| GET | `/api/kpi/employee/{userId}` | Employee personal dashboard |

See [Section 9](#9-kpi-dashboard-fields) for full field list.

---

### Analytics & Reports
- `GET /api/analytics` — existing analytics endpoint
- `GET /api/chart-data` — chart data (open, no auth)
- `GET /api/reports` — report generation

---

## 5. WebSocket Reference

### Connection
```
ws://localhost:9090/ws
```
Uses **SockJS** with **STOMP** protocol.

```javascript
// Frontend example (stomp.js / @stomp/stompjs)
const client = new Client({
  webSocketFactory: () => new SockJS('http://localhost:9090/ws'),
  onConnect: () => {
    // subscribe to personal notifications
    client.subscribe(`/topic/notifications/${userId}`, (msg) => { ... });
    // subscribe to DMs
    client.subscribe(`/topic/chat/user/${userId}`, (msg) => { ... });
    // subscribe to team channel
    client.subscribe(`/topic/chat/team/${teamId}`, (msg) => { ... });
    // subscribe to typing indicators
    client.subscribe(`/topic/chat/typing/user_${userId}`, (msg) => { ... });
  }
});
```

---

### Topic Destinations (server → client)
| Topic | Payload | Description |
|-------|---------|-------------|
| `/topic/notifications/{userId}` | `NotificationDTO` | Real-time notification push |
| `/topic/chat/user/{recipientId}` | `ChatMessageDTO` | Incoming DM |
| `/topic/chat/team/{teamId}` | `ChatMessageDTO` | Team channel message |
| `/topic/chat/typing/{channelId}` | `TypingPayload` | Typing indicator |

**TypingPayload**:
```json
{
  "channelId": "user_42",
  "senderId": 7,
  "senderName": "Jane Doe",
  "isTyping": true
}
```
`channelId` format: `user_{userId}` for DMs or `team_{teamId}` for team channels.

---

### App Destinations (client → server)
| Destination | Payload | Description |
|-------------|---------|-------------|
| `/app/chat.send` | `ChatMessageDTO` | Send a message via WebSocket |
| `/app/chat.typing` | `{ channelId, senderId, senderName, isTyping }` | Broadcast typing indicator |

**Sending a DM**:
```json
{
  "messageType": "DIRECT",
  "senderId": 1,
  "recipientId": 2,
  "content": "Hey!"
}
```

**Sending a team message**:
```json
{
  "messageType": "TEAM",
  "senderId": 1,
  "teamId": 5,
  "content": "Standing up at 10!"
}
```

---

## 6. Notification System

Notifications are created automatically by backend services for every significant event and pushed in real-time via WebSocket.

| Event | Trigger | Recipients |
|-------|---------|------------|
| Leave submitted | `LeaveRequestServiceImpl.create()` | Requesting user |
| Leave approved | `updateStatus(APPROVED)` | Requesting user |
| Leave rejected | `updateStatus(REJECTED)` | Requesting user |
| Leave cancelled | `cancel()` | Requesting user |
| Task assigned | `TaskServiceImpl.create()` | Assignee |
| Task status changed | `updateStatus()` | Assignee + creator |
| Task commented | `addComment()` | Task assignee |
| Project updated | `ProjectServiceImpl.update()` | All team members |
| Project status changed | `updateStatus()` | All team members |
| Team member added | `TeamServiceImpl.addMember()` | New member |
| Team member removed | `removeMember()` | Removed member |
| Meeting scheduled | `MeetingServiceImpl.create()` | All attendees |
| Meeting updated | `update()` | All attendees |
| Meeting cancelled | `cancel()` | All attendees |
| DM received | `ChatServiceImpl.sendMessage(DIRECT)` | Recipient |

---

## 7. Email Templates

Located in `src/main/resources/templates/` (Thymeleaf):

| Template | Subject | Trigger |
|----------|---------|---------|
| `registrationEmail.html` | Welcome to HR Management! | User registration |
| `leaveRequestEmail.html` | Leave Request Submitted | Leave request created |
| `approvalEmail.html` | Your Leave Request Has Been Approved | Leave approved |
| `rejectionEmail.html` | Your Leave Request Has Been Rejected | Leave rejected |
| `scheduleCreationEmail.html` | Schedule Created | Timesheet schedule created |

---

## 8. Security Configuration

### Public paths (no JWT required)
```
/auth/**
/ws/**
/api/users/**
/api/chart-data
/api/leave-requests/**
/api/analytics/**
/api/requests/**
/api/time-sheets/**
/api/projects/**
/api/teams/**
/api/tasks/**
/api/meetings/**
/api/chat/**
/api/notifications/**
/api/kpi/**
/v3/api-docs/**
/swagger-ui/**
```

> **Note**: Public paths are broad intentionally for development. In production, tighten these to only `/auth/**` and `/ws/**`, and enable fine-grained `@PreAuthorize` on all endpoints.

### Role-based access (via `@PreAuthorize`)
- `hasRole('HR')` guards: user management, project creation, team management, meeting scheduling, KPI HR dashboard.
- All other endpoints accept any authenticated user.

### CORS
- Allowed origins: `http://localhost:5173`
- All headers and methods allowed
- Credentials allowed

---

## 9. KPI Dashboard Fields

`KpiDashboardDTO` returned by `/api/kpi/*`:

### HR Dashboard (`/api/kpi/hr`)
**Workforce**
- `totalEmployees`, `totalHrUsers`, `totalManagers`
- `departmentBreakdown: Map<String, Long>`

**Leave**
- `totalLeaveRequestsThisYear`, `pendingLeaveRequests`, `approvedLeaveRequests`, `rejectedLeaveRequests`
- `leaveByType: Map<String, Long>`
- `avgLeaveDaysPerEmployee`

**Attendance / Schedule**
- `totalSchedulesSubmitted`, `approvedSchedules`, `pendingSchedules`

**Projects**
- `totalProjects`, `activeProjects`, `completedProjects`, `overdueProjects`
- `projectsByStatus: Map<String, Long>`, `projectsByDepartment: Map<String, Long>`

**Tasks**
- `totalTasks`, `completedTasks`, `overdueTasks`, `taskCompletionRate` (%)
- `tasksByStatus: Map<String, Long>`

**Teams**
- `totalTeams`

**Meetings**
- `totalMeetings`, `upcomingMeetings`, `completedMeetings`

**Performance**
- `avgPerformanceScore`, `evaluationsThisYear`

---

### Project Dashboard (`/api/kpi/project/{projectId}`)
- `projectName`, `projectStatus`, `projectDeadline`
- `totalTasks`, `completedTasks`, `inProgressTasks`, `blockedTasks`, `overdueTasks`, `taskCompletionRate`
- `tasksByPriority: Map<String, Long>`, `tasksByAssignee: Map<String, Long>`
- `totalTeamMembers`, `totalMeetings`

---

### Employee Dashboard (`/api/kpi/employee/{userId}`)
- `employeeName`, `department`, `position`
- `myTotalTasks`, `myCompletedTasks`, `myInProgressTasks`, `myOverdueTasks`
- `myLeaveBalance` (days remaining), `myUsedLeaveDays`, `myPendingLeaveRequests`
- `myTeams: List<String>`, `myProjects: List<String>`
- `myMeetingsThisMonth`, `myPerformanceScore`

---

## 10. Project Package Structure

```
com.react.project/
├── Config/
│   ├── ApplicationConfig.java         Spring beans (UserDetailsService, AuthProvider, etc.)
│   ├── Initialize.java                Seeds admin@admin.com on startup
│   ├── JwtAuthenticationFilter.java   JWT filter
│   ├── OpenAPIConfiguration.java      Swagger/OpenAPI config
│   ├── PasswordEncoderConfig.java     BCrypt bean
│   ├── SecurityConfiguration.java     HTTP security + CORS
│   └── WebSocketConfig.java           STOMP broker config
├── Controller/
│   ├── AnalyticsController.java
│   ├── AuthenticationController.java
│   ├── ChartDataController.java
│   ├── ChatController.java            REST + @MessageMapping
│   ├── KpiController.java
│   ├── LeaveRequestController.java
│   ├── MeetingController.java
│   ├── NotificationController.java
│   ├── PerformanceEvaluationController.java
│   ├── ProjectController.java
│   ├── ReportController.java
│   ├── TaskController.java
│   ├── TeamController.java
│   ├── TimesheetScheduleController.java
│   ├── TimeSheetController.java
│   └── UserController.java
├── DTO/                               (request/response objects)
├── Enumirator/                        (all enums)
├── Exception/                         (custom exceptions + handlers)
├── Mapper/
├── Model/                             (JPA entities)
├── Repository/                        (Spring Data JPA)
├── Service/                           (interfaces)
└── ServiceImpl/                       (implementations)
```

---

*Generated automatically — update when adding new features.*
