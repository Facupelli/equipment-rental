import z from "zod";

export const UserSchema = z.object({
  id: z.uuid(),
  tenantId: z.uuid(),
  email: z.email(),
  passwordHash: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  isActive: z.boolean().default(true),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date(),
  deletedAt: z.date().nullable().optional(),
});

export const UserCreateSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  firstName: z.string(),
  lastName: z.string(),
});

export const UserUpdateSchema = UserSchema.partial()
  .omit({
    id: true,
    tenantId: true,
    createdAt: true,
    deletedAt: true,
    passwordHash: true,
  })
  .extend({
    password: z.string().min(8).optional(),
  });

export type User = z.infer<typeof UserSchema>;
export type UserCreate = z.infer<typeof UserCreateSchema>;
export type UserUpdate = z.infer<typeof UserUpdateSchema>;
