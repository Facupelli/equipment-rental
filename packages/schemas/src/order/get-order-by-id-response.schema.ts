import { OrderItemType, OrderStatus } from "@repo/types";
import { z } from "zod";

const CustomerSummarySchema = z.object({
  id: z.uuid(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  isCompany: z.boolean(),
  companyName: z.string().nullable(),
});

const LocationSummarySchema = z.object({
  name: z.string(),
});

const RentalPeriodSchema = z.object({
  start: z.date(),
  end: z.date(),
});

const AssetSummarySchema = z.object({
  id: z.uuid(),
  serialNumber: z.string().nullable(),
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
  ruleId: z.uuid(),
  type: z.enum(["PERCENTAGE", "FLAT"]),
  value: z.number(),
  discountAmount: z.string(), // Decimal serialized as string
});

const FinancialLineSchema = z.object({
  orderItemId: z.uuid(),
  label: z.string(),
  currency: z.string(),
  basePrice: z.string(), // Decimal serialized as string
  finalPrice: z.string(), // Decimal serialized as string
  discounts: z.array(DiscountLineSchema),
});

const FinancialBreakdownSchema = z.object({
  items: z.array(FinancialLineSchema),
  total: z.string(), // Decimal serialized as string — sum of finalPrices
});

export const orderDetailSchema = z.object({
  id: z.uuid(),
  status: z.enum(OrderStatus),
  number: z.number().int(),
  createdAt: z.date(),
  notes: z.string().nullable(),
  customer: CustomerSummarySchema.nullable(),
  location: LocationSummarySchema,
  period: RentalPeriodSchema,
  items: z.array(OrderItemDetailSchema),
  financial: FinancialBreakdownSchema,
});

export type OrderDetailResponseDto = z.infer<typeof orderDetailSchema>;

export const getOrderByIdParamSchema = z.object({
  orderId: z.uuid(),
});

export type GetOrderByIdParamDto = z.infer<typeof getOrderByIdParamSchema>;
