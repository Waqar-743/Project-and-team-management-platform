# QA and deployment report

## Automated quality gate

GitHub Actions and local QA run Prisma generation, ESLint, strict TypeScript, Vitest, and the optimized Next.js production build. A failure stops the workflow. Tests cover request validation, authentication throttling, manager/member review boundaries, dependency blocking, and valid approval.

## Executed database/API checks — 13 July 2026

- PostgreSQL schema synchronized and seed completed.
- Manager login succeeded and returned exactly two managed projects and six scoped tasks.
- Member login returned four assigned tasks.
- Direct member attempt to mark a task Done was rejected by the backend.
- Manager reports returned two project-health records and three workload records.
- Member comment creation and time logging persisted successfully.
- Refresh-token rotation succeeded.
- Admin user creation and suspension succeeded and produced audit data.
- Responsive browser QA at a 375 px viewport found no horizontal overflow.
- Browser QA found and fixed locale-dependent activity-date hydration; the repaired dashboard and reports render with a clean console.

## Security review

- Password hashes never leave the database.
- Access and refresh cookies are HTTP-only; production cookies are Secure.
- Resource queries enforce ownership or membership before reads and writes.
- Login is throttled and request bodies are validated.
- Security headers deny framing, MIME sniffing, unnecessary browser capabilities, and unsafe referrer leakage.
- No environment secrets are committed.

## Deployment state

The application and local PostgreSQL integration are verified. CI is configured. Public GitHub push is handled from the local repository. A public live URL still requires the repository owner to provision hosting/database environment variables.
