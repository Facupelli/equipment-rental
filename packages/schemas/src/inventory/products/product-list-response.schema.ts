import { z } from "zod";
import { IncludedItemSchema } from "./create-product.schema";
import { TrackingType } from "@repo/types";

const CategorySummarySchema = z.object({
  id: z.uuid(),
  name: z.string(),
});

const ProductListItemSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  trackingType: z.enum(TrackingType),
  attributes: z.record(z.string(), z.any()),
  includedItems: z.array(IncludedItemSchema),
  category: CategorySummarySchema.nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type ProductListItemResponseDto = z.infer<typeof ProductListItemSchema>;

//

export const GetProductsQuerySchema = z.object({
  categoryId: z.uuid().optional(),
  trackingType: z.enum(TrackingType).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type GetProductsQueryDto = z.infer<typeof GetProductsQuerySchema>;
