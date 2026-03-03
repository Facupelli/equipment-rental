import { z } from "zod";

export const userRoleItemSchema = z.object({
  roleId: z.string(),
  roleName: z.string(),
  locationId: z.string().nullable(),
  // Optionally include permissions if you want them eagerly loaded
  // permissions: z.array(z.string()),
});

export const meResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  fullName: z.string(),
  isActive: z.boolean(),
  tenantId: z.string(),
  roles: z.array(userRoleItemSchema),
});

export type MeResponseDto = z.infer<typeof meResponseSchema>;
