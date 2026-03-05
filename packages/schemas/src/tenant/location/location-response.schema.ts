import { z } from "zod";

export const locationListItemResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  address: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
});

export const locationListResponseSchema = z.array(
  locationListItemResponseSchema,
);

export type LocationListItemResponse = z.infer<
  typeof locationListItemResponseSchema
>;
export type LocationListResponse = z.infer<typeof locationListResponseSchema>;
