import z from "zod";

const pricingPreviewSchema = z.object({
  pricePerUnit: z.number(),
  fromUnit: z.number().int(),
});

export const newArrivalResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  categoryId: z.uuid().nullable(),
  publishedAt: z.date(),
  billingUnit: z.object({
    label: z.string(),
  }),
  pricingPreview: pricingPreviewSchema.nullable(),
});

export const newArrivalsResponseSchema = z.array(newArrivalResponseSchema);

export type NewArrivalItemResponseDto = z.infer<
  typeof newArrivalResponseSchema
>;
export type NewArrivalListResponseDto = z.infer<
  typeof newArrivalsResponseSchema
>;

export const getNewArrivalsParamsSchema = z.object({
  locationId: z.uuid().optional(),
});

export type GetNewArrivalsParams = z.infer<typeof getNewArrivalsParamsSchema>;
