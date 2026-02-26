import { InventoryItemStatus } from "@repo/types";
import { z } from "zod";

export const createInventoryItemSchema = z.object({
  productId: z.uuid({ message: "Valid Product ID is required" }),

  locationId: z.uuid({ message: "Valid Location ID is required" }),
  ownerId: z.uuid({ message: "Valid Owner ID is required" }),

  totalQuantity: z.coerce
    .number<number>()
    .int()
    .positive({ message: "Quantity must be at least 1" }),

  serialNumber: z.string().max(100).optional(),

  purchaseDate: z.coerce.date().optional(),

  purchaseCost: z.coerce.number<number>().min(0).optional(),

  status: z
    .enum(InventoryItemStatus)
    .optional()
    .default(InventoryItemStatus.OPERATIONAL),
});

export type CreateInventoryItemDto = z.infer<typeof createInventoryItemSchema>;
