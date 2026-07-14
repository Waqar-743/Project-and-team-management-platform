# Forge — Project and Team Task Management

[![Quality gate](https://github.com/Waqar-743/Project-and-team-management-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/Waqar-743/Project-and-team-management-platform/actions/workflows/ci.yml)
[![Vercel](https://img.shields.io/badge/Live_on_Vercel-c66a31?logo=vercel&logoColor=white)](https://project-and-team-management-platfor.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js_15-262821?logo=next.js)](https://nextjs.org/)

**[Open the live application](https://project-and-team-management-platfor.vercel.app)**

Forge is a production-style, multi-user project operations platform. Administrators control access and audit activity, project managers coordinate delivery and reviews, and team members collaborate on assigned work.

## What it includes

- Secure login, logout, rotating refresh tokens, and authentication throttling
- Backend-enforced role and resource authorization
- User, role, project, member, milestone, and task management
- Drag-and-drop Kanban with an accessible status-menu fallback
- Task review, approval, return feedback, blocked work, and dependencies
- Checklists, discussions, time entries, and deadline requests
- Database-driven notifications, audit history, workload reports, and CSV export
- Responsive role-aware dashboards with loading, empty, and error states
- PostgreSQL/Prisma relationships, validation, soft deletion, tests, and CI

## Technology

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS 4 |
| Backend | Node.js REST route handlers in Next.js |
| Database | PostgreSQL with Prisma ORM |
| Security | bcrypt, signed JWT access cookies, rotating refresh tokens, Zod |
| Testing | Vitest, HTTP smoke tests, strict TypeScript, ESLint |
| Delivery | GitHub Actions, Vercel, Docker Compose |

The frontend and backend are deployed together as one Next.js application. Browser components call REST endpoints under `/api`; those endpoints validate the request, authorize the signed-in user, and read or update PostgreSQL through Prisma.

## Demo access

| Role | Email | Password |
|---|---|---|
| Administrator | `admin@forge.test` | `Forge@2026` |
| Project manager | `manager@forge.test` | `Forge@2026` |
| Team member | `member@forge.test` | `Forge@2026` |

Rotate or remove these accounts before using the application for real organizational data.

## Local setup

Requirements: Node.js 20+, npm, and PostgreSQL 15+.

```bash
git clone https://github.com/Waqar-743/Project-and-team-management-platform.git
cd Project-and-team-management-platform
npm install
cp .env.example .env
docker compose up -d
npm run db:push
npm run db:seed
npm run dev
```

Open `http://localhost:3000`.

### Environment variables

```env
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
JWT_SECRET="a-random-secret-with-at-least-32-characters"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

For Vercel, `DATABASE_URL` must use a publicly reachable managed PostgreSQL service; `localhost` cannot work inside a serverless function. The production build runs committed migrations with `prisma migrate deploy`.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Generate Prisma Client and build the full application |
| `npm run vercel-build` | Apply production migrations and build on Vercel |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run strict TypeScript checking |
| `npm test` | Run the test suite |
| `npm run db:push` | Synchronize a local development schema |
| `npm run db:migrate` | Apply committed production migrations |
| `npm run db:seed` | Reset and seed the local demo database |

## File structure

```text
.
├── .github/
│   └── workflows/
│       └── ci.yml                     # Lint, typecheck, tests and build
├── docs/                              # Submission and QA evidence
├── prisma/
│   ├── migrations/                    # Production PostgreSQL migrations
│   ├── schema.prisma                  # Relational data model
│   └── seed.ts                        # Local demo accounts and data
├── public/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/                  # Login, logout and token rotation
│   │   │   ├── deadline-requests/     # Extension review workflow
│   │   │   ├── health/                # Deployment/database health probe
│   │   │   ├── notifications/         # In-app notification APIs
│   │   │   ├── projects/              # Projects, members and milestones
│   │   │   ├── reports/               # Health, workload and CSV reports
│   │   │   ├── subtasks/              # Checklist updates
│   │   │   ├── tasks/                 # Tasks and collaboration workflows
│   │   │   └── users/                 # Administrator user controls
│   │   ├── dashboard/                 # Role-aware application workspace
│   │   ├── login/                     # Secure sign-in experience
│   │   ├── globals.css                # Design tokens and shared styling
│   │   ├── layout.tsx                 # Metadata and root layout
│   │   └── page.tsx                   # Session-aware entry route
│   └── lib/
│       ├── access.ts                  # Resource authorization policies
│       ├── auth.ts                    # Access and refresh sessions
│       ├── db.ts                      # Prisma client lifecycle
│       ├── rate-limit.ts              # Authentication throttling
│       ├── validation.ts              # Zod request contracts
│       └── workflow.ts                # Task-transition policies
├── docker-compose.yml                 # Local PostgreSQL
├── next.config.ts                     # Next.js and security headers
├── vercel.json                        # Production build configuration
└── package.json
```

## Role permissions

| Capability | Administrator | Project manager | Team member |
|---|---:|---:|---:|
| View projects | All | Managed projects | Assigned projects |
| Create projects and tasks | Yes | Managed projects | No |
| Assign members and work | Yes | Managed projects | No |
| Update task progress | Yes | Managed projects | Assigned tasks |
| Approve submitted tasks | Yes | Managed projects | No |
| Manage users and roles | Yes | No | No |
| View reports | Global | Managed projects | Personal scope |

Authorization is enforced by REST handlers and database queries. Removing a UI control is never treated as a security boundary.

## API reference

All request and response bodies use JSON unless marked as multipart or CSV. Authentication uses the `forge_session` and `forge_refresh` HTTP-only cookies. Errors return `{ "error": "message" }`; validation failures can also include `fields`.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/health` | Public | Verify application and database health |
| POST | `/api/auth/login` | Public, rate limited | Issue access and refresh cookies |
| POST | `/api/auth/refresh` | Refresh cookie | Rotate the session |
| POST | `/api/auth/logout` | Signed in | Revoke the current session |
| GET / POST | `/api/users` | Administrator | List/search or create users |
| PATCH | `/api/users` | Administrator | Change role/status or archive a user |
| GET / POST | `/api/projects` | Scoped / manager+ | List or create projects |
| PATCH / DELETE | `/api/projects/:id` | Owning manager/admin | Update or archive a project |
| POST / DELETE | `/api/projects/:id/members` | Owning manager/admin | Add or remove a member |
| POST | `/api/projects/:id/milestones` | Owning manager/admin | Add a milestone |
| GET / POST | `/api/tasks` | Scoped / manager+ | Paginated list or task creation |
| GET / PATCH / DELETE | `/api/tasks/:id` | Scoped | Details, workflow update, or archive |
| POST | `/api/tasks/:id/comments` | Task participant | Comment or reply |
| POST | `/api/tasks/:id/subtasks` | Task participant | Add a checklist item |
| PATCH | `/api/subtasks/:id` | Task participant | Complete or reopen a checklist item |
| POST | `/api/tasks/:id/dependencies` | Manager/admin | Add a same-project dependency |
| POST | `/api/tasks/:id/time` | Task participant | Record work time |
| POST | `/api/tasks/:id/deadline` | Task participant | Request a deadline extension |
| PATCH | `/api/deadline-requests/:id` | Owning manager/admin | Approve or reject an extension |
| GET / PATCH | `/api/notifications` | Signed in | List or mark notifications read |
| GET | `/api/reports?format=csv` | Signed in, scoped | Reports and CSV export |

Task-list filters: `projectId`, `status`, `search`, `page`, and `limit` (maximum 100).

The browser and REST API share one origin, so the application intentionally does not enable permissive CORS. Introduce an explicit origin allow-list only if the frontend and API are deployed on separate origins.

## Architecture and diagrams

### Runtime architecture

```mermaid
flowchart LR
  B[Browser / React UI] -->|HTTPS + HTTP-only cookies| N[Next.js Node.js REST API]
  N --> V[Zod validation]
  N --> A[Session and RBAC policies]
  V --> P[Prisma data access]
  A --> P
  P --> D[(Managed PostgreSQL)]
  G[GitHub Actions] -->|lint, typecheck, test, build| R[GitHub repository]
  R -->|verified main branch| C[Vercel deployment]
  C --> N
```

### Entity relationship diagram

```mermaid
erDiagram
  USER ||--o{ PROJECT : manages
  USER ||--o{ PROJECT_MEMBER : joins
  PROJECT ||--o{ PROJECT_MEMBER : contains
  PROJECT ||--o{ MILESTONE : plans
  PROJECT ||--o{ TASK : owns
  USER ||--o{ TASK : assigned
  TASK ||--o{ SUBTASK : contains
  TASK ||--o{ TASK_DEPENDENCY : requires
  TASK ||--o{ COMMENT : discusses
  TASK ||--o{ TIME_ENTRY : tracks
  TASK ||--o{ DEADLINE_EXTENSION : requests
  USER ||--o{ NOTIFICATION : receives
  USER ||--o{ REFRESH_TOKEN : owns
  USER ||--o{ AUDIT_LOG : creates
```

### Main use cases

```mermaid
flowchart TB
  Admin[Administrator] --> Users[Manage users, roles and access]
  Admin --> Global[View global projects, reports and audit events]
  Manager[Project manager] --> Projects[Manage assigned projects and members]
  Manager --> Review[Assign, review and approve work]
  Member[Team member] --> Tasks[View and update assigned tasks]
  Member --> Collaborate[Comment, log time and request extensions]
  Users --> API[Protected REST API]
  Global --> API
  Projects --> API
  Review --> API
  Tasks --> API
  Collaborate --> API
```

## CI and deployment

The GitHub Actions quality gate runs on every push and pull request:

1. Install locked dependencies with `npm ci`.
2. Generate Prisma Client.
3. Run ESLint and strict TypeScript checks.
4. Run all Vitest tests.
5. Build the complete frontend and Node.js backend.

Vercel deploys the verified `main` branch and publishes the stable URL linked at the top of this README. GitHub Pages is intentionally not used because it only serves static files and cannot run authenticated Next.js route handlers or connect to PostgreSQL.

