import z from "zod";

export const ProductCategorySchema = z.object({
  id: z.uuid(),
  tenantId: z.uuid(),
  name: z.string(),
  description: z.string().nullable().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date(),
});

export const ProductCategoryCreateSchema = ProductCategorySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const ProductCategoryUpdateSchema = ProductCategorySchema.partial().omit(
  {
    id: true,
    tenantId: true,
    createdAt: true,
  },
);

export type ProductCategory = z.infer<typeof ProductCategorySchema>;
export type ProductCategoryCreate = z.infer<typeof ProductCategoryCreateSchema>;
export type ProductCategoryUpdate = z.infer<typeof ProductCategoryUpdateSchema>;
