import { z } from "zod";

export const meResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  fullName: z.string(),
  isActive: z.boolean(),
  tenantId: z.string(),
  roleId: z.string(),
});

export type MeResponseDto = z.infer<typeof meResponseSchema>;
