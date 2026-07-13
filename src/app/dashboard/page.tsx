import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import DashboardClient from "./dashboard-client";
export default async function Dashboard() {
  const s = await getSession();
  if (!s) redirect("/login");
  const projectWhere =
    s.role === "ADMIN"
      ? {}
      : s.role === "PROJECT_MANAGER"
        ? { managerId: s.id }
        : { members: { some: { userId: s.id } } };
  const taskWhere =
    s.role === "ADMIN"
      ? {}
      : s.role === "PROJECT_MANAGER"
        ? { project: { managerId: s.id } }
        : { assigneeId: s.id };
  const projectIds = (
    await db.project.findMany({
      where: { ...projectWhere, archivedAt: null },
      select: { id: true },
    })
  ).map((p) => p.id);
  const userWhere =
    s.role === "ADMIN"
      ? { archivedAt: null }
      : {
          OR: [
            { id: s.id },
            { memberships: { some: { projectId: { in: projectIds } } } },
          ],
        };
  const [rawProjects, tasks, users, assignableUsers, activities, notifications, auditCount] =
    await Promise.all([
      db.project.findMany({
        where: { ...projectWhere, archivedAt: null },
        include: {
          manager: { select: { name: true } },
          members: {
            include: {
              user: { select: { id: true, name: true, title: true, role: true, status: true } },
            },
          },
          tasks: { where: { archivedAt: null }, select: { status: true } },
          _count: { select: { tasks: { where: { archivedAt: null } } } },
        },
        orderBy: { updatedAt: "desc" },
      }),
      db.task.findMany({
        where: { ...taskWhere, archivedAt: null },
        include: {
          project: { select: { name: true, code: true } },
          assignee: { select: { name: true } },
          timeEntries: { select: { minutes: true } },
          _count: { select: { subtasks: true, comments: true } },
        },
        orderBy: { updatedAt: "desc" },
      }),
      db.user.findMany({
        where: userWhere,
        select: { id: true, name: true, title: true, role: true, status: true },
        orderBy: { name: "asc" },
      }),
      s.role === "TEAM_MEMBER"
        ? Promise.resolve([])
        : db.user.findMany({
            where: {
              role: "TEAM_MEMBER",
              status: "ACTIVE",
              archivedAt: null,
            },
            select: { id: true, name: true, title: true, role: true, status: true },
            orderBy: { name: "asc" },
          }),
      db.activity.findMany({
        where:
          s.role === "ADMIN"
            ? {}
            : {
                OR: [
                  { entityType: "Project", entityId: { in: projectIds } },
                  {
                    entityType: "Task",
                    entityId: {
                      in: (
                        await db.task.findMany({
                          where: taskWhere,
                          select: { id: true },
                        })
                      ).map((t) => t.id),
                    },
                  },
                ],
              },
        include: { actor: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      db.notification.findMany({
        where: { userId: s.id },
        orderBy: { createdAt: "desc" },
        take: 12,
      }),
      s.role === "ADMIN" ? db.auditLog.count() : Promise.resolve(0),
    ]);
  const projects = rawProjects.map((p) => ({
    ...p,
    progress: p.tasks.length
      ? Math.round(
          (p.tasks.filter((t) => t.status === "DONE").length / p.tasks.length) *
            100,
        )
      : 0,
  }));
  return (
    <DashboardClient
      session={s}
      projects={projects}
      tasks={tasks}
      users={users}
      assignableUsers={assignableUsers}
      activities={activities}
      notifications={notifications}
      auditCount={auditCount}
    />
  );
}
