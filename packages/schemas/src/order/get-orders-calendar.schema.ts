import { OrderStatus } from "@repo/types";
import { z } from "zod";

export const OrderCalendarStatusSchema = z.enum([
	OrderStatus.CONFIRMED,
	OrderStatus.ACTIVE,
]);

const OrderCalendarCustomerSummarySchema = z.object({
	id: z.uuid(),
	displayName: z.string(),
	isCompany: z.boolean(),
});

export const OrderCalendarItemSchema = z.object({
	id: z.uuid(),
	number: z.number().int(),
	status: OrderCalendarStatusSchema,
	pickupAt: z.iso.datetime(),
	returnAt: z.iso.datetime(),
	pickupDate: z.iso.date(),
	returnDate: z.iso.date(),
	customer: OrderCalendarCustomerSummarySchema.nullable(),
});

export const GetOrdersCalendarResponseSchema = z.object({
	orders: z.array(OrderCalendarItemSchema),
});

export const GetOrdersCalendarQuerySchema = z
	.object({
		locationId: z.uuid(),
		rangeStart: z.iso.datetime(),
		rangeEnd: z.iso.datetime(),
	})
	.refine((data) => new Date(data.rangeStart).getTime() < new Date(data.rangeEnd).getTime(), {
		message: "rangeStart must be before rangeEnd",
		path: ["rangeStart"],
	});

export type OrderCalendarStatus = z.infer<typeof OrderCalendarStatusSchema>;
export type OrderCalendarItem = z.infer<typeof OrderCalendarItemSchema>;
export type GetOrdersCalendarResponse = z.infer<typeof GetOrdersCalendarResponseSchema>;
export type GetOrdersCalendarQueryDto = z.infer<typeof GetOrdersCalendarQuerySchema>;
