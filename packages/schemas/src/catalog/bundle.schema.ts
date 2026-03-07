import { z } from "zod/v4";

const BundleComponentSchema = z.object({
  productTypeId: z.string().uuid(),
  quantity: z.int().positive(),
});

export const CreateBundleSchema = z.object({
  name: z.string().min(1),
  billingUnitId: z.string().uuid(),
  components: z.array(BundleComponentSchema).min(1),
});

export type CreateBundleDto = z.infer<typeof CreateBundleSchema>;
