import { PrismaClient, Priority, ProjectStatus, Role, TaskStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Forge@2026", 12);

  const admin = await db.user.upsert({
    where: { email: "admin@forge.test" },
    update: {},
    create: {
      name: "Mara Voss",
      email: "admin@forge.test",
      passwordHash,
      role: Role.ADMIN,
      title: "Operations Director",
    },
  });
  const manager = await db.user.upsert({
    where: { email: "manager@forge.test" },
    update: {},
    create: {
      name: "Idris Vale",
      email: "manager@forge.test",
      passwordHash,
      role: Role.PROJECT_MANAGER,
      title: "Product Lead",
    },
  });
  const member = await db.user.upsert({
    where: { email: "member@forge.test" },
    update: {},
    create: {
      name: "Noor Sayeed",
      email: "member@forge.test",
      passwordHash,
      role: Role.TEAM_MEMBER,
      title: "Frontend Engineer",
    },
  });

  const existingProject = await db.project.findUnique({ where: { code: "ATL-24" } });
  if (!existingProject) {
    const project = await db.project.create({
      data: {
        name: "Atlas Commerce",
        code: "ATL-24",
        description: "Rebuild the merchant operations experience and reporting workflow.",
        status: ProjectStatus.ACTIVE,
        startDate: new Date("2026-06-02"),
        dueDate: new Date("2026-08-28"),
        managerId: manager.id,
        members: { create: [{ userId: manager.id }, { userId: member.id }] },
      },
    });
    await db.task.createMany({
      data: [
        {
          title: "Resolve checkout edge states",
          status: TaskStatus.IN_PROGRESS,
          priority: Priority.URGENT,
          assigneeId: member.id,
          projectId: project.id,
          creatorId: manager.id,
          dueDate: new Date("2026-07-24"),
          estimate: 360,
        },
        {
          title: "Instrument funnel events",
          status: TaskStatus.TODO,
          priority: Priority.MEDIUM,
          assigneeId: member.id,
          projectId: project.id,
          creatorId: manager.id,
          dueDate: new Date("2026-07-28"),
          estimate: 240,
        },
      ],
    });
  }

  console.log(`Production demo data is ready (${admin.email}).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
