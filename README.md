# Forge — Project & Team Task Management

Forge is a full-stack, role-aware project operations platform built for the intern practical assignment. It gives administrators system visibility, project managers delivery control, and team members a focused view of assigned work.

## Stack

- Next.js 15 / React 19 / TypeScript / Tailwind CSS 4
- Node.js REST API through Next.js route handlers
- PostgreSQL with Prisma ORM
- Signed JWT sessions stored in secure, HTTP-only cookies
- Zod validation, bcrypt password hashing, Vitest, GitHub Actions

## Quick start

1. Install Node.js 20+ and PostgreSQL 15+.
2. Copy `.env.example` to `.env` and update `DATABASE_URL` and `JWT_SECRET`.
3. Run `npm install`.
4. Run `npm run db:push` and `npm run db:seed`.
5. Start with `npm run dev`, then open `http://localhost:3000`.

Demo users share password `Forge@2026`: `admin@forge.test`, `manager@forge.test`, and `member@forge.test`.

## Role permissions

| Capability | Administrator | Project manager | Team member |
|---|---:|---:|---:|
| View all projects/users | Yes | Managed projects | Assigned projects |
| Create projects/tasks | Yes | Own projects | No |
| Assign team work | Yes | Own projects | No |
| Update task status | Yes | Own projects | Assigned tasks |
| Manage access | Yes | No | No |

Authorization is enforced in server route handlers; hiding a UI control is never treated as security.

## Quality commands

`npm run typecheck`, `npm test`, `npm run lint`, and `npm run build` are also executed by CI on every push and pull request. The workflow generates Prisma Client before validation and does not require a live database for the build.

## Documentation

- [API reference](docs/API.md)
- [Architecture and diagrams](docs/ARCHITECTURE.md)
- [Feature completion report](docs/FEATURE_REPORT.md)
- [QA report](docs/QA_REPORT.md)
- [AI disclosure](docs/AI_DISCLOSURE.md)

## Deployment

Provision PostgreSQL (Neon, Supabase, Railway, or managed Postgres), set the three values from `.env.example`, run `prisma db push`, and deploy to Vercel. Rotate the demo password and use a randomly generated 32+ character JWT secret for public deployments.

## Recording checklist

Show admin people access, manager portfolio and task creation, task board status movement, member-scoped login, responsive mobile navigation, then briefly show CI and documentation. A focused 3–5 minute recording is ideal.
