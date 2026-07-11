# REST API reference

All bodies and responses use JSON. Authentication uses the `forge_session` HTTP-only cookie. Errors use `{ "error": "message" }`, with optional `fields` for validation errors.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Create session from email/password |
| POST | `/api/auth/logout` | Signed in | Clear session |
| GET | `/api/projects` | Signed in, scoped | List visible projects |
| POST | `/api/projects` | Admin, manager | Create project |
| GET | `/api/tasks?projectId=` | Signed in, scoped | List visible tasks |
| POST | `/api/tasks` | Admin, manager | Create and assign task |
| PATCH | `/api/tasks/:id` | Admin, owning manager, assignee | Update task status |

Login example: `{"email":"manager@forge.test","password":"Forge@2026"}`. Task creation example: `{"title":"Review acceptance criteria","projectId":"...","assigneeId":"...","priority":"HIGH"}`. Status update example: `{"status":"IN_REVIEW"}`.

Common status codes: 200 success, 201 created, 401 unauthenticated, 403 unauthorized, 404 missing resource, 422 validation error.
