import { z } from "zod";

export const ownerListItemResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
});

export const ownerListResponseSchema = z.array(ownerListItemResponseSchema);

export type OwnerListItemResponse = z.infer<typeof ownerListItemResponseSchema>;
export type OwnerListResponse = z.infer<typeof ownerListResponseSchema>;
