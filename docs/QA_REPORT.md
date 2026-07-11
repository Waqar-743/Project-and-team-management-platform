# QA report

## Evaluation matrix

- Functional: authentication, role-scoped data, create task and status movement covered.
- Security: password hashes, expiring HTTP-only cookie, input validation, ownership checks, no secrets committed.
- Data: normalized many-to-many membership, referential deletion behavior, useful task/activity indexes.
- UX: no blue or pink; charcoal, parchment, rust and sage palette; responsive navigation; loading/error feedback; empty board states; reduced-motion support.
- Engineering: strict TypeScript, small API surfaces, reproducible seed data and automated CI.

## Manual acceptance pass

1. Seed and log in as each demo role.
2. Confirm team members cannot see other users' tasks or create tasks.
3. Confirm managers only see and modify managed projects.
4. Create a task as manager, move it across the board, refresh, and confirm persistence.
5. Test login error, keyboard focus, mobile widths 375/768/1440, and reduced-motion preference.
6. Confirm production secrets and demo passwords are rotated before public deployment.
