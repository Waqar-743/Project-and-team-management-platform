# REST API reference

All requests and responses use JSON unless marked as multipart or CSV. Authentication uses `forge_session` and `forge_refresh` HTTP-only cookies. Errors consistently return `{ "error": "message" }` and validation failures can include `fields`.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/login` | Public, rate limited | Sign in and issue access/refresh cookies |
| POST | `/api/auth/refresh` | Refresh cookie | Rotate refresh token and access cookie |
| POST | `/api/auth/logout` | Signed in | Revoke current refresh token and clear cookies |
| GET/POST | `/api/users` | Admin | Search/list or create users |
| PATCH | `/api/users` | Admin | Change role/status or archive user |
| GET/POST | `/api/projects` | Scoped / manager+ | List or create projects |
| PATCH/DELETE | `/api/projects/:id` | Owning manager/admin | Update or archive a project |
| POST/DELETE | `/api/projects/:id/members` | Owning manager/admin | Add/remove a project member |
| POST | `/api/projects/:id/milestones` | Owning manager/admin | Add project milestone |
| GET/POST | `/api/tasks` | Scoped / manager+ | Paginated task list or create task |
| GET/PATCH/DELETE | `/api/tasks/:id` | Scoped | Details, workflow update, or archive |
| POST | `/api/tasks/:id/comments` | Task participant | Comment or reply |
| POST | `/api/tasks/:id/subtasks` | Task participant | Add checklist item |
| PATCH | `/api/subtasks/:id` | Task participant | Complete/reopen checklist item |
| POST | `/api/tasks/:id/dependencies` | Manager/admin | Add same-project dependency |
| POST | `/api/tasks/:id/time` | Task participant | Record work time |
| POST | `/api/tasks/:id/deadline` | Task participant | Request deadline extension |
| PATCH | `/api/deadline-requests/:id` | Owning manager/admin | Approve/reject extension |
| GET/PATCH | `/api/notifications` | Signed in | List or mark notifications read |
| GET | `/api/reports[?format=csv]` | Signed in, scoped | Project health and workload report/export |

Task list query parameters: `projectId`, `status`, `search`, `page`, and `limit` (maximum 100).

The browser and API share one origin, so the app intentionally does not enable permissive CORS. This removes a cross-origin attack surface. Add an explicit origin allow-list only if a separately hosted client is introduced.
