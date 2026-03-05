import { z } from "zod";

export const productCategoryResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const productCategoryListResponseSchema = z.array(
  productCategoryResponseSchema,
);

export type ProductCategoryResponse = z.infer<
  typeof productCategoryResponseSchema
>;
export type ProductCategoryListResponse = z.infer<
  typeof productCategoryListResponseSchema
>;
