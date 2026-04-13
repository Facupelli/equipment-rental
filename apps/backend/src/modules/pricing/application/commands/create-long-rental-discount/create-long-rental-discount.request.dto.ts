import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const LongRentalDiscountTierSchema = z.object({
  fromUnits: z.coerce.number().int().positive(),
  toUnits: z.coerce.number().int().positive().nullable(),
  discountPct: z.coerce.number().min(0).max(100),
});

const LongRentalDiscountTargetSchema = z.object({
  excludedProductTypeIds: z.array(z.string().uuid()).default([]),
  excludedBundleIds: z.array(z.string().uuid()).default([]),
});

export const CreateLongRentalDiscountSchema = z.object({
  name: z.string().min(1),
  priority: z.coerce.number().int().min(0),
  tiers: z.array(LongRentalDiscountTierSchema).min(1),
  target: LongRentalDiscountTargetSchema.optional(),
});

export class CreateLongRentalDiscountRequestDto extends createZodDto(CreateLongRentalDiscountSchema) {}
