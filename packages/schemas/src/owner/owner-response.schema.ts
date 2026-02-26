import z from "zod";

export const OwnerResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type OwnerResponseDto = z.infer<typeof OwnerResponseSchema>;
