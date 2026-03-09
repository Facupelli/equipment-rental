import { z } from "zod/v4";

const BundleComponentSchema = z.object({
  productTypeId: z.uuid(),
  quantity: z.int().positive(),
});

export const CreateBundleSchema = z.object({
  name: z.string().min(1),
  billingUnitId: z.uuid(),
  isActive: z.boolean().default(true),
  components: z.array(BundleComponentSchema).min(1),
});

export type CreateBundleDto = z.infer<typeof CreateBundleSchema>;

// RESPONSE

export const BundleListItemSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  billingUnitId: z.uuid(),
  billingUnit: z.object({
    label: z.string(),
  }),
  // First pricing tier (lowest fromUnit). Null when no tiers exist yet.
  basePrice: z.number().nullable(),
  componentCount: z.number().int().nonnegative(),
  createdAt: z.coerce.date(),
});

export const GetBundlesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
  name: z.string().min(1).optional(),
});

export type GetBundlesQueryDto = z.infer<typeof GetBundlesQuerySchema>;
export type BundleListItemResponseDto = z.infer<typeof BundleListItemSchema>;

// BUNDLE DETAIL

export const bundleDetailComponentSchema = z.object({
  productTypeId: z.uuid(),
  quantity: z.number().int().positive(),
  // Active, non-deleted asset count — used as quantity ceiling in the edit form.
  assetCount: z.number().int().nonnegative(),
  productType: z.object({
    name: z.string(),
    description: z.string().nullable(),
  }),
});

export const bundleDetailPricingTierSchema = z.object({
  id: z.uuid(),
  fromUnit: z.number().int(),
  // null means open-ended (∞)
  toUnit: z.number().int().nullable(),
  pricePerUnit: z.number(),
  locationId: z.uuid().nullable(),
  location: z
    .object({
      id: z.uuid(),
      name: z.string(),
    })
    .nullable(),
});

export const bundleDetailResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  publishedAt: z.coerce.date().nullable(),
  retiredAt: z.coerce.date().nullable(),
  billingUnit: z.object({
    id: z.uuid(),
    label: z.string(),
    durationMinutes: z.number().int(),
  }),
  components: z.array(bundleDetailComponentSchema),
  pricingTiers: z.array(bundleDetailPricingTierSchema),
});

export type BundleDetailComponentDto = z.infer<
  typeof bundleDetailComponentSchema
>;
export type BundleDetailPricingTierDto = z.infer<
  typeof bundleDetailPricingTierSchema
>;
export type BundleDetailResponseDto = z.infer<
  typeof bundleDetailResponseSchema
>;
