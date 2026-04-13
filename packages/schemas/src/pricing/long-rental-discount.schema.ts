import { z } from "zod";

export const longRentalDiscountTierSchema = z.object({
	fromUnits: z.number().int().positive(),
	toUnits: z.number().int().positive().nullable(),
	discountPct: z.number().min(0).max(100),
});

export const longRentalDiscountTargetSchema = z.object({
	excludedProductTypeIds: z.array(z.uuid()).default([]),
	excludedBundleIds: z.array(z.uuid()).default([]),
});

export const createLongRentalDiscountSchema = z
	.object({
		name: z.string().min(1),
		priority: z.number().int().min(0),
		tiers: z.array(longRentalDiscountTierSchema).min(1),
		target: longRentalDiscountTargetSchema.optional(),
	})
	.superRefine((data, ctx) => {
		for (let index = 0; index < data.tiers.length; index++) {
			const tier = data.tiers[index];

			if (tier.toUnits !== null && tier.toUnits < tier.fromUnits) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ["tiers", index, "toUnits"],
					message: "toUnits must be greater than or equal to fromUnits",
				});
			}

			if (index === 0) {
				continue;
			}

			const previousTier = data.tiers[index - 1];
			const previousEnd = previousTier.toUnits ?? Number.POSITIVE_INFINITY;

			if (tier.fromUnits <= previousEnd) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ["tiers", index, "fromUnits"],
					message: "Tiers must not overlap",
				});
			}
		}

		const lastTier = data.tiers[data.tiers.length - 1];

		if (lastTier && lastTier.toUnits !== null) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["tiers", data.tiers.length - 1, "toUnits"],
				message: "The last tier must have toUnits as null (open-ended)",
			});
		}
	});

export type LongRentalDiscountTier = z.infer<
	typeof longRentalDiscountTierSchema
>;
export type LongRentalDiscountTarget = z.infer<
	typeof longRentalDiscountTargetSchema
>;
export type CreateLongRentalDiscountDto = z.infer<
	typeof createLongRentalDiscountSchema
>;
