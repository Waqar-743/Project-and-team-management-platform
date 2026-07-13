import { Role, TaskStatus } from "@prisma/client";
export function transitionError(
  role: Role,
  from: TaskStatus,
  to: TaskStatus,
  hasIncompleteDependencies = false,
) {
  if (from === to) return null;
  if (to !== TaskStatus.BLOCKED && hasIncompleteDependencies)
    return "Complete task dependencies first";

  // Administrators can intervene to unblock an exceptional delivery issue.
  if (role === Role.ADMIN) return null;

  const allowed: Partial<Record<TaskStatus, TaskStatus[]>> =
    role === Role.TEAM_MEMBER
      ? {
          TODO: [TaskStatus.IN_PROGRESS, TaskStatus.BLOCKED],
          IN_PROGRESS: [TaskStatus.IN_REVIEW, TaskStatus.BLOCKED],
          BLOCKED: [TaskStatus.IN_PROGRESS],
        }
      : {
          BACKLOG: [TaskStatus.TODO, TaskStatus.BLOCKED],
          TODO: [TaskStatus.BACKLOG, TaskStatus.IN_PROGRESS, TaskStatus.BLOCKED],
          IN_PROGRESS: [TaskStatus.TODO, TaskStatus.IN_REVIEW, TaskStatus.BLOCKED],
          IN_REVIEW: [TaskStatus.IN_PROGRESS, TaskStatus.DONE, TaskStatus.BLOCKED],
          BLOCKED: [TaskStatus.TODO, TaskStatus.IN_PROGRESS],
          DONE: [TaskStatus.IN_PROGRESS],
        };
  if (!(allowed[from] ?? []).includes(to)) {
    return role === Role.TEAM_MEMBER
      ? "Team members can start assigned work, report blockers, and submit work for review. A project manager approves completion."
      : "Only submitted tasks can be approved. Follow the delivery flow: plan, work, submit for review, then approve.";
  }
  return null;
}
