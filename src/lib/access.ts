import { Role } from "@prisma/client";
import { db } from "./db";
import type { Session } from "./auth";
export async function taskAccess(session: Session, taskId: string) {
  const task = await db.task.findUnique({
    where: { id: taskId },
    include: { project: true, dependencies: { include: { dependsOn: true } } },
  });
  if (!task || task.archivedAt) return null;
  if (session.role === Role.ADMIN) return task;
  if (
    session.role === Role.PROJECT_MANAGER &&
    task.project.managerId === session.id
  )
    return task;
  if (session.role === Role.TEAM_MEMBER && task.assigneeId === session.id)
    return task;
  return null;
}
export async function projectAccess(
  session: Session,
  projectId: string,
  manage = false,
) {
  if (session.role === Role.ADMIN) return true;
  if (session.role === Role.PROJECT_MANAGER)
    return !!(await db.project.findFirst({
      where: { id: projectId, managerId: session.id, archivedAt: null },
    }));
  if (manage) return false;
  return !!(await db.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: session.id } },
  }));
}
