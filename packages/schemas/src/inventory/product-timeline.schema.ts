import { AssignmentType, OrderStatus, TrackingMode } from "@repo/types";
import { z } from "zod";

const productTimelineCustomerSchema = z.object({
  id: z.uuid(),
  displayName: z.string(),
  isCompany: z.boolean(),
});

const productTimelineOrderSchema = z.object({
  id: z.uuid(),
  number: z.number().int(),
  status: z.enum(OrderStatus),
  customer: productTimelineCustomerSchema.nullable(),
});

export const productTimelineBlockSchema = z.object({
  id: z.uuid(),
  type: z.enum(AssignmentType),
  startsAt: z.iso.datetime(),
  endsAt: z.iso.datetime(),
  label: z.string(),
  status: z.enum(["active", "upcoming", "past"]),
  order: productTimelineOrderSchema.nullable(),
  reason: z.string().nullable(),
});

export const productTimelineAssetRowSchema = z.object({
  asset: z.object({
    id: z.uuid(),
    serialNumber: z.string().nullable(),
    notes: z.string().nullable(),
    isActive: z.boolean(),
    owner: z
      .object({
        id: z.uuid(),
        name: z.string(),
      })
      .nullable(),
  }),
  timeline: z.array(productTimelineBlockSchema),
});

export const productTimelineResponseSchema = z.object({
  productType: z.object({
    id: z.uuid(),
    name: z.string(),
    trackingMode: z.enum(TrackingMode),
  }),
  location: z.object({
    id: z.uuid(),
    name: z.string(),
  }),
  range: z.object({
    from: z.iso.datetime(),
    to: z.iso.datetime(),
    timezone: z.string(),
  }),
  summary: z.object({
    totalAssets: z.number().int().nonnegative(),
    activeAssets: z.number().int().nonnegative(),
    inactiveAssets: z.number().int().nonnegative(),
    availableNow: z.number().int().nonnegative(),
    inOrderNow: z.number().int().nonnegative(),
    inBlackoutNow: z.number().int().nonnegative(),
    inMaintenanceNow: z.number().int().nonnegative(),
  }),
  assets: z.array(productTimelineAssetRowSchema),
});

export const getProductTimelineQuerySchema = z
  .object({
    productTypeId: z.uuid(),
    locationId: z.uuid(),
    from: z.iso.datetime(),
    to: z.iso.datetime(),
  })
  .refine((data) => new Date(data.from).getTime() <= new Date(data.to).getTime(), {
    message: "from must be before or equal to to",
    path: ["from"],
  });

export type ProductTimelineBlock = z.infer<typeof productTimelineBlockSchema>;
export type ProductTimelineAssetRow = z.infer<typeof productTimelineAssetRowSchema>;
export type ProductTimelineResponse = z.infer<typeof productTimelineResponseSchema>;
export type GetProductTimelineQuery = z.infer<typeof getProductTimelineQuerySchema>;
