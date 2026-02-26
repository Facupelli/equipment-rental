import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, "Category name cannot be empty."),
  description: z.string().trim().min(1).nullable().optional(),
});

export type CreateCategorySchema = z.infer<typeof createCategorySchema>;
