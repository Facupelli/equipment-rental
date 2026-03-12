import { OrderStatus } from "@repo/types";
import z from "zod";

const CustomerSummarySchema = z.object({
  id: z.string(),
  displayName: z.string(),
  isCompany: z.boolean(),
});

const OrderSummarySchema = z.object({
  id: z.string(),
  number: z.number().int(),
  status: z.enum(OrderStatus),
  periodStart: z.string(), // "YYYY-MM-DD"
  periodEnd: z.string(), // "YYYY-MM-DD"
  customer: CustomerSummarySchema.nullable(),
});

export const ScheduleEventSchema = z.object({
  eventType: z.enum(["PICKUP", "RETURN"]),
  eventDate: z.string(), // "YYYY-MM-DD"
  order: OrderSummarySchema,
});

export const GetScheduleResponseSchema = z.object({
  events: z.array(ScheduleEventSchema),
});

export type OrderSummary = z.infer<typeof OrderSummarySchema>;
export type ScheduleEvent = z.infer<typeof ScheduleEventSchema>;
export type GetOrdersScheduleResponse = z.infer<
  typeof GetScheduleResponseSchema
>;

export const GetOrdersScheduleQuerySchema = z.object({
  locationId: z.uuid(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
});

export type GetOrdersScheduleQuery = z.infer<
  typeof GetOrdersScheduleQuerySchema
>;

// CALENDAR DOTS RESPONSE

export const GetCalendarDotsResponseSchema = z.object({
  pickupDates: z.array(z.iso.date()),
  returnDates: z.array(z.iso.date()),
});

export type GetCalendarDotsResponseDto = z.infer<
  typeof GetCalendarDotsResponseSchema
>;

export const GetCalendarDotsQuerySchema = z
  .object({
    locationId: z.uuid(),
    from: z.iso.date(),
    to: z.iso.date(),
  })
  .refine((data) => data.from <= data.to, {
    message: "from must be before or equal to to",
    path: ["from"],
  });

export type GetCalendarDotsQueryDto = z.infer<
  typeof GetCalendarDotsQuerySchema
>;
