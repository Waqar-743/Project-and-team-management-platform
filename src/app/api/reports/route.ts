import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
export async function GET(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const projectScope =
    s.role === Role.ADMIN
      ? {}
      : s.role === Role.PROJECT_MANAGER
        ? { managerId: s.id }
        : { members: { some: { userId: s.id } } };
  const taskScope =
    s.role === Role.ADMIN
      ? {}
      : s.role === Role.PROJECT_MANAGER
        ? { project: { managerId: s.id } }
        : { assigneeId: s.id };
  const [projects, statuses, overdue, workload] = await Promise.all([
    db.project.findMany({
      where: { ...projectScope, archivedAt: null },
      include: {
        tasks: {
          where: { archivedAt: null },
          select: { status: true, dueDate: true },
        },
      },
    }),
    db.task.groupBy({
      by: ["status"],
      where: { ...taskScope, archivedAt: null },
      _count: true,
    }),
    db.task.count({
      where: {
        ...taskScope,
        archivedAt: null,
        dueDate: { lt: new Date() },
        status: { not: "DONE" },
      },
    }),
    db.user.findMany({
      where: { memberships: { some: { project: projectScope } } },
      select: {
        id: true,
        name: true,
        assignedTasks: {
          where: { archivedAt: null, status: { not: "DONE" } },
          select: {
            status: true,
            estimate: true,
            dueDate: true,
            timeEntries: { select: { minutes: true } },
          },
        },
      },
    }),
  ]);
  const health = projects.map((p) => {
    const blocked = p.tasks.filter((t) => t.status === "BLOCKED").length;
    const overdueTasks = p.tasks.filter(
      (t) => t.dueDate && t.dueDate < new Date() && t.status !== "DONE",
    ).length;
    return {
      id: p.id,
      name: p.name,
      health:
        p.status === "COMPLETED"
          ? "COMPLETED"
          : p.dueDate < new Date()
            ? "DELAYED"
            : blocked || overdueTasks
              ? "AT_RISK"
              : "ON_TRACK",
    };
  });
  const data = {
    statuses,
    overdue,
    health,
    workload: workload.map((u) => ({
      id: u.id,
      name: u.name,
      active: u.assignedTasks.length,
      overdue: u.assignedTasks.filter(
        (t) => t.dueDate && t.dueDate < new Date(),
      ).length,
      estimatedMinutes: u.assignedTasks.reduce(
        (a, t) => a + (t.estimate || 0),
        0,
      ),
      actualMinutes: u.assignedTasks
        .flatMap((t) => t.timeEntries)
        .reduce((a, x) => a + x.minutes, 0),
    })),
  };
  if (new URL(req.url).searchParams.get("format") === "csv") {
    const rows = [
      "Name,Active,Overdue,Estimated minutes,Actual minutes",
      ...data.workload.map(
        (x) =>
          `"${x.name}",${x.active},${x.overdue},${x.estimatedMinutes},${x.actualMinutes}`,
      ),
    ];
    return new NextResponse(rows.join("\n"), {
      headers: {
        "content-type": "text/csv",
        "content-disposition": 'attachment; filename="forge-workload.csv"',
      },
    });
  }
  return NextResponse.json(data);
}
