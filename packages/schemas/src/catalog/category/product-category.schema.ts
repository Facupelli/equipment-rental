import z from "zod";

export const createProductCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().nullable(),
});

export const updateProductCategorySchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().nullable().optional(),
});

export type CreateProductCategoryDto = z.infer<
  typeof createProductCategorySchema
>;
export type UpdateProductCategoryDto = z.infer<
  typeof updateProductCategorySchema
>;
