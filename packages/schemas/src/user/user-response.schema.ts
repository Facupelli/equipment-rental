import { z } from "zod";

export const userRoleResponseSchema = z.object({
  roleId: z.uuid(),
  roleName: z.string(),
  locationId: z.uuid().nullable(),
});

export const meResponseSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  firstName: z.string(),
  lastName: z.string(),
  fullName: z.string(),
  isActive: z.boolean(),
  tenantId: z.uuid(),
  roles: z.array(userRoleResponseSchema),
});

export type UserRoleResponse = z.infer<typeof userRoleResponseSchema>;
export type MeResponse = z.infer<typeof meResponseSchema>;
