import {
	FulfillmentMethod,
	OrderItemType,
	OrderStatus,
	PromotionAdjustmentType,
} from "@repo/types";
import { z } from "zod";

const CustomerSummarySchema = z.object({
	id: z.uuid(),
	firstName: z.string(),
	lastName: z.string(),
	email: z.string(),
	isCompany: z.boolean(),
	companyName: z.string().nullable(),
});

const LocationSummarySchema = z.object({
	name: z.string(),
	effectiveTimezone: z.string(),
});

const RentalPeriodSchema = z.object({
	start: z.date(),
	end: z.date(),
});

const DeliveryRequestSchema = z.object({
	recipientName: z.string(),
	phone: z.string(),
	addressLine1: z.string(),
	addressLine2: z.string().nullable(),
	city: z.string(),
	stateRegion: z.string(),
	postalCode: z.string(),
	country: z.string(),
	instructions: z.string().nullable(),
});

const AssetSummarySchema = z.object({
	id: z.uuid(),
	serialNumber: z.string().nullable(),
	productTypeId: z.string(),
	ownerId: z.string().nullable(),
	ownerName: z.string().nullable(),
});

const ProductTypeItemSchema = z.object({
	id: z.uuid(),
	type: z.literal(OrderItemType.PRODUCT),
	name: z.string(),
	assets: z.array(AssetSummarySchema),
});

const BundleComponentSnapshotSchema = z.object({
	productTypeId: z.uuid(),
	productTypeName: z.string(),
	quantity: z.number().int(),
});

const BundleItemSchema = z.object({
	id: z.uuid(),
	type: z.literal(OrderItemType.BUNDLE),
	name: z.string(),
	components: z.array(BundleComponentSnapshotSchema),
	assets: z.array(AssetSummarySchema),
});

const OrderItemDetailSchema = z.discriminatedUnion("type", [
	ProductTypeItemSchema,
	BundleItemSchema,
]);

const DiscountLineSchema = z.object({
	sourceKind: z.literal("PROMOTION"),
	sourceId: z.uuid(),
	label: z.string(),
	promotionId: z.uuid(),
	promotionLabel: z.string(),
	type: z.literal(PromotionAdjustmentType.PERCENTAGE),
	value: z.number(),
	discountAmount: z.string(),
});

export type DiscountLine = z.infer<typeof DiscountLineSchema>;

const OwnerSplitLineSchema = z
	.object({
		ownerName: z.string(),
		ownerAmount: z.string(),
		rentalAmount: z.string(),
		componentName: z.string().nullable(),
	})
	.nullable();

const FinancialLineSchema = z.object({
	orderItemId: z.uuid(),
	label: z.string(),
	currency: z.string(),
	basePrice: z.string(),
	finalPrice: z.string(),
	discounts: z.array(DiscountLineSchema),
	ownerSplit: OwnerSplitLineSchema,
});

const FinancialBreakdownSchema = z.object({
	items: z.array(FinancialLineSchema),
	itemsSubtotal: z.string(),
	subtotalBeforeDiscounts: z.string(),
	itemsDiscountTotal: z.string(),
	insuranceApplied: z.boolean(),
	insuranceAmount: z.string(),
	total: z.string(),
	yourRevenue: z.string(),
	ownerObligations: z.string(),
});

export const orderDetailSchema = z.object({
	id: z.uuid(),
	status: z.enum(OrderStatus),
	fulfillmentMethod: z.enum(FulfillmentMethod),
	number: z.number().int(),
	createdAt: z.date(),
	pickupDate: z.iso.date(),
	returnDate: z.iso.date(),
	pickupAt: z.date(),
	returnAt: z.date(),
	notes: z.string().nullable(),
	customer: CustomerSummarySchema.nullable(),
	location: LocationSummarySchema,
	deliveryRequest: DeliveryRequestSchema.nullable(),
	period: RentalPeriodSchema,
	items: z.array(OrderItemDetailSchema),
	financial: FinancialBreakdownSchema,
});

export type OrderDetailResponseDto = z.infer<typeof orderDetailSchema>;

export const getOrderByIdParamSchema = z.object({
	orderId: z.uuid(),
});

export type GetOrderByIdParamDto = z.infer<typeof getOrderByIdParamSchema>;
