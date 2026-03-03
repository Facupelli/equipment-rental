import z from "zod";

export const BundleComponentSchema = z.object({
  id: z.uuid(),
  bundleId: z.uuid(),
  productTypeId: z.uuid(),
  quantity: z.number().int(),
});

export const BundleComponentCreateSchema = BundleComponentSchema.omit({
  id: true,
});

export const BundleComponentUpdateSchema = BundleComponentSchema.partial().omit(
  {
    id: true,
    bundleId: true,
    productTypeId: true,
  },
);

export type BundleComponent = z.infer<typeof BundleComponentSchema>;
export type BundleComponentCreate = z.infer<typeof BundleComponentCreateSchema>;
export type BundleComponentUpdate = z.infer<typeof BundleComponentUpdateSchema>;

export const BundleSchema = z.object({
  id: z.uuid(),
  tenantId: z.uuid(),
  name: z.string(),
  isActive: z.boolean().default(true),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date(),
  components: z.array(z.lazy(() => BundleComponentSchema)),
});

export const BundleCreateSchema = BundleSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  components: true,
});

export const BundleUpdateSchema = BundleSchema.partial().omit({
  id: true,
  tenantId: true,
  createdAt: true,
  components: true,
});

export type Bundle = z.infer<typeof BundleSchema>;
export type BundleCreate = z.infer<typeof BundleCreateSchema>;
export type BundleUpdate = z.infer<typeof BundleUpdateSchema>;
