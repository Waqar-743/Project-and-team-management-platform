# System architecture

```mermaid
flowchart LR
  U[Browser / Next.js UI] -->|HTTPS + secure cookie| A[Node.js REST route handlers]
  A --> V[Zod validation]
  A --> R[Session + role authorization]
  V --> S[Service / Prisma data access]
  R --> S
  S --> P[(PostgreSQL)]
  G[GitHub Actions] -->|lint, typecheck, test, build| U
```

## Entity relationship diagram

```mermaid
erDiagram
  USER ||--o{ PROJECT : manages
  USER ||--o{ PROJECT_MEMBER : joins
  PROJECT ||--o{ PROJECT_MEMBER : contains
  PROJECT ||--o{ TASK : owns
  USER ||--o{ TASK : assigned
  USER ||--o{ TASK : creates
  TASK ||--o{ COMMENT : has
  USER ||--o{ COMMENT : writes
  USER ||--o{ ACTIVITY : performs
  USER ||--o{ NOTIFICATION : receives
  USER ||--o{ REFRESH_TOKEN : owns
  USER ||--o{ AUDIT_LOG : creates
  PROJECT ||--o{ MILESTONE : plans
  TASK ||--o{ SUBTASK : contains
  TASK ||--o{ TASK_DEPENDENCY : requires
  TASK ||--o{ TIME_ENTRY : records
  TASK ||--o{ ATTACHMENT : stores
  TASK ||--o{ DEADLINE_EXTENSION : requests
```

## Use cases

```mermaid
flowchart TB
  Admin[Administrator] --> AU[Manage users and roles]
  Admin --> AP[Access every project]
  PM[Project manager] --> CP[Create and manage projects]
  PM --> AT[Assign members and tasks]
  Member[Team member] --> VP[View assigned projects]
  Member --> UT[Update assigned task progress]
  Admin --> API[Authenticated REST API]
  PM --> API
  Member --> API
```

The application is a modular monolith: the browser and server ship together, while all data access crosses authenticated REST endpoints or protected React Server Components. This offers simple deployment for the assignment and leaves clear seams for extracting services later.
