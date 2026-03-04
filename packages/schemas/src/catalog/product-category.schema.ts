import z from "zod";
import { nullableOptional } from "../shared";

export const ProductCategorySchema = z.object({
  id: z.uuid(),
  tenantId: z.uuid(),
  name: z.string(),
  description: nullableOptional(z.string()),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date(),
});

export const ProductCategoryCreateSchema = ProductCategorySchema.omit({
  id: true,
  tenantId: true,
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
