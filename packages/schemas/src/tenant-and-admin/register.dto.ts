import { z } from "zod";

export const registerResponseSchema = z.object({
  userId: z.uuid(),
  tenantId: z.uuid(),
});

export type RegisterResponseDto = z.infer<typeof registerResponseSchema>;
