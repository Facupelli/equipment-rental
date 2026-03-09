import { z } from "zod";

const pricingPreviewSchema = z.object({
  pricePerUnit: z.number(),
  fromUnit: z.number().int(),
});

const comboComponentSchema = z.object({
  quantity: z.number().int().positive(),
  productType: z.object({
    id: z.uuid(),
    name: z.string(),
  }),
});

export const bundleItemResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  billingUnit: z.object({
    label: z.string(),
  }),
  pricingPreview: pricingPreviewSchema.nullable(),
  components: z.array(comboComponentSchema),
});

export const bundleListResponseSchema = z.array(bundleItemResponseSchema);

export type BundleItemResponse = z.infer<typeof bundleItemResponseSchema>;
export type BundleListResponseDto = z.infer<typeof bundleListResponseSchema>;

export const getBundleParamsSchema = z.object({
  locationId: z.uuid().optional(),
});

export type GetCombosParams = z.infer<typeof getBundleParamsSchema>;
