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
  isActive: z.boolean(),
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
