import {
	createLongRentalDiscountSchema,
	type CreateLongRentalDiscountDto,
	type LongRentalDiscountTier,
} from "@repo/schemas";
import { z } from "zod";

export const longRentalDiscountTierFormSchema = z.object({
	fromUnits: z.number().int().positive("Debe ser al menos 1"),
	toUnits: z.number().int().positive("Debe ser al menos 1").nullable(),
	discountPct: z
		.number()
		.min(0, "El descuento debe ser 0 o mayor")
		.max(100, "El descuento no puede superar el 100%"),
});

export const longRentalDiscountFormSchema = z
	.object({
		name: z.string().min(1, "El nombre es obligatorio"),
		priority: z.number().int().min(0, "La prioridad debe ser 0 o mayor"),
		tiers: z
			.array(longRentalDiscountTierFormSchema)
			.min(1, "Agrega al menos un tramo"),
	})
	.superRefine((data, ctx) => {
		for (const [index, tier] of data.tiers.entries()) {
			if (tier.toUnits !== null && tier.toUnits < tier.fromUnits) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ["tiers", index, "toUnits"],
					message: "Hasta debe ser mayor o igual que desde",
				});
			}

			if (index === 0) {
				continue;
			}

			const previousTier = data.tiers[index - 1];

			if (previousTier.toUnits === null) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ["tiers", index, "fromUnits"],
					message: "No se pueden agregar tramos después de uno abierto",
				});
				continue;
			}

			if (tier.fromUnits <= previousTier.toUnits) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ["tiers", index, "fromUnits"],
					message: "Los tramos no pueden superponerse",
				});
			}
		}

		const lastTier = data.tiers.at(-1);

		if (lastTier && lastTier.toUnits !== null) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["tiers", data.tiers.length - 1, "toUnits"],
				message: "El último tramo debe quedar abierto",
			});
		}
	});

export type LongRentalDiscountFormValues = z.infer<
	typeof longRentalDiscountFormSchema
>;

export const longRentalDiscountFormDefaults: LongRentalDiscountFormValues = {
	name: "",
	priority: 0,
	tiers: [{ fromUnits: 1, toUnits: null, discountPct: 0 }],
};

export function createEmptyLongRentalDiscountTier(
	previousTier?: LongRentalDiscountTier,
): LongRentalDiscountTier {
	if (!previousTier) {
		return { fromUnits: 1, toUnits: null, discountPct: 0 };
	}

	return {
		fromUnits:
			previousTier.toUnits === null
				? previousTier.fromUnits + 1
				: previousTier.toUnits + 1,
		toUnits: null,
		discountPct: previousTier.discountPct,
	};
}

export function toCreateLongRentalDiscountDto(
	values: LongRentalDiscountFormValues,
): CreateLongRentalDiscountDto {
	return createLongRentalDiscountSchema.parse({
		name: values.name.trim(),
		priority: values.priority,
		tiers: values.tiers.map((tier) => ({
			fromUnits: tier.fromUnits,
			toUnits: tier.toUnits,
			discountPct: tier.discountPct,
		})),
	});
}
