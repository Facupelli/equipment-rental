import { OrderStatus } from "@repo/types";
import { paginatedSchema } from "../api/api.schema";
import { z } from "zod";

const PendingReviewCustomerSummarySchema = z.object({
  id: z.uuid(),
  displayName: z.string(),
  isCompany: z.boolean(),
});

const PendingReviewLocationSummarySchema = z.object({
  id: z.uuid(),
  name: z.string(),
});

export const pendingReviewOrderListItemSchema = z.object({
  id: z.uuid(),
  number: z.number().int(),
  status: z.enum(OrderStatus),
  createdAt: z.date(),
  periodStart: z.date(),
  periodEnd: z.date(),
  customer: PendingReviewCustomerSummarySchema.nullable(),
  location: PendingReviewLocationSummarySchema,
});

export const getPendingReviewOrdersQuerySchema = z.object({
  locationId: z.uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const getPendingReviewOrdersResponseSchema = paginatedSchema(
  pendingReviewOrderListItemSchema,
);

export type PendingReviewOrderListItem = z.infer<
  typeof pendingReviewOrderListItemSchema
>;
export type GetPendingReviewOrdersQueryDto = z.infer<
  typeof getPendingReviewOrdersQuerySchema
>;
export type GetPendingReviewOrdersResponseDto = z.infer<
  typeof getPendingReviewOrdersResponseSchema
>;
