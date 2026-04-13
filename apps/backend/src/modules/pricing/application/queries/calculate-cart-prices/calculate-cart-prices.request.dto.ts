import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CartProductItemSchema = z.object({
  type: z.literal('PRODUCT'),
  productTypeId: z.string().uuid(),
  quantity: z.number().int().min(1),
});

const CartBundleItemSchema = z.object({
  type: z.literal('BUNDLE'),
  bundleId: z.string().uuid(),
  quantity: z.number().int().min(1),
});

export const CalculateCartPricesRequestSchema = z.object({
  locationId: z.string().uuid(),
  currency: z.string().length(3),
  pickupDate: z.string(),
  returnDate: z.string(),
  items: z.array(z.discriminatedUnion('type', [CartProductItemSchema, CartBundleItemSchema])),
  insuranceSelected: z.boolean().default(false),
  customerId: z.string().uuid().optional(),
  couponCode: z.string().trim().min(1).optional(),
});

export class CalculateCartPricesRequestDto extends createZodDto(CalculateCartPricesRequestSchema) {}
