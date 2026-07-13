# Feature completion report

## Complete and connected

| Area | Implementation |
|---|---|
| Authentication | bcrypt passwords, rate-limited login, 30-minute signed access cookie, rotating seven-day refresh token, current-device logout/revocation |
| Authorization | Backend role, ownership, membership and assignee checks; scoped dashboard/activity queries; ID-changing attacks return 403/404 |
| Administration | Create users, change roles, activate/suspend accounts, audit-log administrative changes, view portfolio and reports |
| Projects | Create/update/archive projects, assign/remove members, add milestones, calculate progress and health from live task data |
| Tasks | Create/assign/archive, priority/deadline/estimate, search/filter/pagination API, drag/drop Kanban plus accessible status menu |
| Review workflow | Member submission to In Review, manager-only approval, return feedback field, dependency blocking |
| Collaboration | Nested comment data model, task discussions, time tracking, deadline requests and in-app notifications |
| Planning | Subtasks/checklists, same-project dependencies, blocked state, deadline-extension request and manager response API |
| Time and reporting | Time entries, estimated-versus-actual totals, workload, overdue/project health reporting, CSV export |
| Resilience/UI | Loading skeletons, empty/error states, optimistic rollback, responsive layout, reduced-motion support, skip link |
| Delivery | Docker PostgreSQL setup, environment template, seeded accounts, GitHub Actions quality gate, diagrams/API/AI documentation |

## Known limitations

- User mentions are stored in comment text but are not parsed into dedicated mention records.
- The dashboard exposes the primary workflows; milestone, dependency, member-removal, extension-review, archive, and nested-reply operations are available through REST but do not yet have dedicated dashboard panels.
- Email/push delivery is outside scope; notifications are database-backed and in-app.
- Refresh rotation is implemented, but “logout all devices” has no UI action yet; it can be implemented by revoking all refresh records for the user.
