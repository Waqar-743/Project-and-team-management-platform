import {
  PrismaClient,
  Role,
  TaskStatus,
  Priority,
  ProjectStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";
const db = new PrismaClient();
async function main() {
  await db.refreshToken.deleteMany();
  await db.auditLog.deleteMany();
  await db.notification.deleteMany();
  await db.deadlineExtension.deleteMany();
  await db.attachment.deleteMany();
  await db.timeEntry.deleteMany();
  await db.taskDependency.deleteMany();
  await db.subtask.deleteMany();
  await db.activity.deleteMany();
  await db.comment.deleteMany();
  await db.milestone.deleteMany();
  await db.task.deleteMany();
  await db.projectMember.deleteMany();
  await db.project.deleteMany();
  await db.user.deleteMany();
  const passwordHash = await bcrypt.hash("Forge@2026", 12);
  const [admin, manager, member, member2] = await Promise.all([
    db.user.create({
      data: {
        name: "Mara Voss",
        email: "admin@forge.test",
        passwordHash,
        role: Role.ADMIN,
        title: "Operations Director",
      },
    }),
    db.user.create({
      data: {
        name: "Idris Vale",
        email: "manager@forge.test",
        passwordHash,
        role: Role.PROJECT_MANAGER,
        title: "Product Lead",
      },
    }),
    db.user.create({
      data: {
        name: "Noor Sayeed",
        email: "member@forge.test",
        passwordHash,
        role: Role.TEAM_MEMBER,
        title: "Frontend Engineer",
      },
    }),
    db.user.create({
      data: {
        name: "Theo Arden",
        email: "theo@forge.test",
        passwordHash,
        role: Role.TEAM_MEMBER,
        title: "Product Designer",
      },
    }),
  ]);
  const p = await db.project.create({
    data: {
      name: "Atlas Commerce",
      code: "ATL-24",
      description:
        "Rebuild the merchant operations experience and reporting workflow.",
      status: ProjectStatus.ACTIVE,
      progress: 68,
      startDate: new Date("2026-06-02"),
      dueDate: new Date("2026-08-28"),
      managerId: manager.id,
      members: {
        create: [
          { userId: manager.id },
          { userId: member.id },
          { userId: member2.id },
        ],
      },
    },
  });
  const p2 = await db.project.create({
    data: {
      name: "Field Notes",
      code: "FLD-07",
      description:
        "Mobile-first research capture for distributed product teams.",
      status: ProjectStatus.PLANNING,
      progress: 24,
      startDate: new Date("2026-07-08"),
      dueDate: new Date("2026-10-16"),
      managerId: manager.id,
      members: { create: [{ userId: manager.id }, { userId: member.id }] },
    },
  });
  const tasks = [
    [
      "Resolve checkout edge states",
      TaskStatus.IN_PROGRESS,
      Priority.URGENT,
      member.id,
      p.id,
    ],
    [
      "Review reporting information model",
      TaskStatus.IN_REVIEW,
      Priority.HIGH,
      member2.id,
      p.id,
    ],
    [
      "Instrument funnel events",
      TaskStatus.TODO,
      Priority.MEDIUM,
      member.id,
      p.id,
    ],
    [
      "Validate responsive table patterns",
      TaskStatus.DONE,
      Priority.HIGH,
      member2.id,
      p.id,
    ],
    [
      "Map offline capture flow",
      TaskStatus.BACKLOG,
      Priority.MEDIUM,
      member.id,
      p2.id,
    ],
    [
      "Prepare research repository",
      TaskStatus.TODO,
      Priority.LOW,
      member.id,
      p2.id,
    ],
  ] as const;
  for (const [title, status, priority, assigneeId, projectId] of tasks)
    await db.task.create({
      data: {
        title,
        status,
        priority,
        assigneeId,
        projectId,
        creatorId: manager.id,
        dueDate: new Date("2026-07-24"),
        estimate: 360,
      },
    });
  const first = await db.task.findFirstOrThrow({
    where: { projectId: p.id, assigneeId: member.id },
  });
  await db.subtask.createMany({
    data: [
      { taskId: first.id, title: "Reproduce mobile failure" },
      { taskId: first.id, title: "Add regression coverage", completed: true },
    ],
  });
  await db.timeEntry.create({
    data: {
      taskId: first.id,
      userId: member.id,
      minutes: 95,
      description: "Traced validation and state synchronization",
      workDate: new Date("2026-07-11"),
    },
  });
  await db.notification.createMany({
    data: [
      {
        userId: member.id,
        type: "TASK_ASSIGNED",
        title: "Task assigned",
        message: first.title,
        link: `/dashboard?task=${first.id}`,
      },
      {
        userId: manager.id,
        type: "TASK_UPDATED",
        title: "Task progress updated",
        message: first.title,
        link: `/dashboard?task=${first.id}`,
      },
    ],
  });
  await db.activity.createMany({
    data: [
      {
        action: "created project",
        entityType: "Project",
        entityId: p2.id,
        actorId: manager.id,
      },
      {
        action: "updated task progress",
        entityType: "Project",
        entityId: p.id,
        actorId: member.id,
      },
      {
        action: "joined the project",
        entityType: "Project",
        entityId: p.id,
        actorId: member2.id,
      },
    ],
  });
  console.log("Seeded. Demo password: Forge@2026", admin.email);
}
main().finally(() => db.$disconnect());
