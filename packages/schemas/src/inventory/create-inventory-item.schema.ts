import { InventoryItemStatus } from "@repo/types";
import { z } from "zod";

export const createInventoryItemSchema = z.object({
  productId: z.uuid({ message: "Valid Product ID is required" }),

  locationId: z.uuid({ message: "Valid Location ID is required" }),
  ownerId: z.uuid({ message: "Valid Owner ID is required" }),

  totalQuantity: z
    .number()
    .int()
    .positive({ message: "Quantity must be at least 1" }),

  serialNumber: z.string().min(1).max(100).nullable().optional(),

  purchaseDate: z
    .string()
    .transform((str) => (str ? new Date(str) : null))
    .nullable()
    .optional(),

  purchaseCost: z.number().min(0).nullable().optional(),

  status: z
    .enum(InventoryItemStatus)
    .optional()
    .default(InventoryItemStatus.OPERATIONAL),
});

export type CreateInventoryItemDto = z.infer<typeof createInventoryItemSchema>;
