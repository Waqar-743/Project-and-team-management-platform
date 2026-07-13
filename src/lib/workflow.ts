import { Role, TaskStatus } from "@prisma/client";
export function transitionError(
  role: Role,
  from: TaskStatus,
  to: TaskStatus,
  hasIncompleteDependencies = false,
) {
  if (to !== TaskStatus.BLOCKED && hasIncompleteDependencies)
    return "Complete task dependencies first";
  if (
    role === Role.TEAM_MEMBER &&
    (to === TaskStatus.DONE ||
      (from === TaskStatus.IN_REVIEW && to !== TaskStatus.IN_REVIEW))
  )
    return "A project manager must review this task";
  if (
    role === Role.PROJECT_MANAGER &&
    to === TaskStatus.DONE &&
    from !== TaskStatus.IN_REVIEW
  )
    return "Only submitted tasks can be approved";
  return null;
}
