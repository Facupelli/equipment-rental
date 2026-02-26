import { z } from "zod";

export const categoryResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type CategoryResponseDto = z.infer<typeof categoryResponseSchema>;
