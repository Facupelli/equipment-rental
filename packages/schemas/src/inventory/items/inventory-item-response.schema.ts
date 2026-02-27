import { InventoryItemStatus } from "@repo/types";
import { z } from "zod";

export const DateRangeResponseSchema = z.object({
  start: z.iso.datetime(),
  end: z.iso.datetime(),
});

export const BlackoutPeriodResponseSchema = z.object({
  id: z.uuid(),
  reason: z.string(),
  blockedPeriod: DateRangeResponseSchema,
  createdAt: z.iso.datetime(),
});

export const InventoryItemResponseSchema = z.object({
  id: z.uuid(),
  productId: z.uuid(),
  locationId: z.uuid(),
  ownerId: z.uuid(),
  status: z.enum(InventoryItemStatus),
  totalQuantity: z.number().int().nonnegative(),
  serialNumber: z.string().nullable(),
  purchaseDate: z.iso.datetime().nullable(),
  purchaseCost: z.number().positive().nullable(),
  blackouts: z.array(BlackoutPeriodResponseSchema),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type InventoryItemResponseDto = z.infer<
  typeof InventoryItemResponseSchema
>;
export type BlackoutPeriodResponseDto = z.infer<
  typeof BlackoutPeriodResponseSchema
>;
