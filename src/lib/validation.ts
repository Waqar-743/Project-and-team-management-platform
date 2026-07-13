import { z } from "zod";
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
export const projectSchema = z
  .object({
    name: z.string().trim().min(3).max(80),
    code: z
      .string()
      .trim()
      .min(2)
      .max(12)
      .regex(/^[A-Z0-9-]+$/),
    description: z.string().trim().min(10).max(500),
    managerId: z.string().min(1),
    startDate: z.coerce.date(),
    dueDate: z.coerce.date(),
  })
  .refine((v) => v.dueDate > v.startDate, {
    message: "Due date must be after start date",
    path: ["dueDate"],
  });
export const taskSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(1000).optional(),
  projectId: z.string().min(1),
  assigneeId: z.string().nullable().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  dueDate: z.coerce.date().nullable().optional(),
  estimate: z.coerce.number().int().min(0).max(10080).optional(),
});
