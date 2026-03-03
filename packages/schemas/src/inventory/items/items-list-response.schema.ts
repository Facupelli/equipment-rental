import { InventoryItemStatus, TrackingType } from "@repo/types";
import { z } from "zod";

const productProjectionSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  trackingType: z.enum(TrackingType),
});

const categoryProjectionSchema = z.object({
  id: z.uuid(),
  name: z.string(),
});

const locationProjectionSchema = z.object({
  id: z.uuid(),
  name: z.string(),
});

const ownerProjectionSchema = z.object({
  id: z.uuid(),
  name: z.string(),
});

export const inventoryItemListItemSchema = z.object({
  id: z.uuid(),
  serialNumber: z.string().nullable(),
  status: z.enum(InventoryItemStatus),
  product: productProjectionSchema,
  category: categoryProjectionSchema.nullable(),
  location: locationProjectionSchema,
  owner: ownerProjectionSchema.nullable(),
});

export type InventoryItemListItemDto = z.infer<
  typeof inventoryItemListItemSchema
>;

//

const booleanFromString = z.preprocess((val) => {
  if (val === "true") return true;
  if (val === "false") return false;
  return val;
}, z.boolean());

export const getInventoryItemsQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),

  categoryId: z.uuid().optional(),
  locationId: z.uuid().optional(),
  status: z.enum(InventoryItemStatus).optional(),

  includeRetired: booleanFromString.default(false),

  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type GetInventoryItemsQueryDto = z.infer<
  typeof getInventoryItemsQuerySchema
>;
