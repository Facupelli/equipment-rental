import { PricingRuleEffectType, PromotionType } from "@repo/types";
import { z } from "zod";
import { createPromotionSchema, type CreatePromotionDto } from "@repo/schemas";

const seasonalConditionFormSchema = z.object({
	type: z.literal(PromotionType.SEASONAL),
	dateFrom: z.string().min(1, "La fecha desde es obligatoria"),
	dateTo: z.string().min(1, "La fecha hasta es obligatoria"),
});

const couponConditionFormSchema = z.object({
	type: z.literal(PromotionType.COUPON),
});

const customerSpecificConditionFormSchema = z.object({
	type: z.literal(PromotionType.CUSTOMER_SPECIFIC),
	customerId: z.uuid("Ingresa un ID de cliente válido"),
});

const promotionConditionFormSchema = z.discriminatedUnion("type", [
	seasonalConditionFormSchema,
	couponConditionFormSchema,
	customerSpecificConditionFormSchema,
]);

export const promotionFormSchema = z
	.object({
		name: z.string().min(1, "El nombre es obligatorio"),
		type: z.enum(PromotionType),
		priority: z.number().int().min(0, "La prioridad debe ser 0 o mayor"),
		stackable: z.boolean(),
		condition: promotionConditionFormSchema,
		effect: z.object({
			type: z.enum(PricingRuleEffectType),
			value: z.number().min(0, "El valor debe ser 0 o mayor"),
		}),
	})
	.superRefine((data, ctx) => {
		if (data.type !== data.condition.type) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["condition"],
				message: "La condición debe coincidir con el tipo de promoción",
			});
		}

		if (
			data.effect.type === PricingRuleEffectType.PERCENTAGE &&
			data.effect.value > 100
		) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["effect", "value"],
				message: "El porcentaje no puede ser mayor a 100",
			});
		}

		if (data.effect.value <= 0) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["effect", "value"],
				message: "El valor debe ser mayor a 0",
			});
		}

		if (
			data.condition.type === PromotionType.SEASONAL &&
			data.condition.dateFrom >= data.condition.dateTo
		) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["condition", "dateTo"],
				message: "La fecha hasta debe ser posterior a la fecha desde",
			});
		}
	});

export type PromotionFormValues = z.infer<typeof promotionFormSchema>;

export function defaultConditionFor(
	type: PromotionType,
): PromotionFormValues["condition"] {
	switch (type) {
		case PromotionType.SEASONAL:
			return { type: PromotionType.SEASONAL, dateFrom: "", dateTo: "" };
		case PromotionType.COUPON:
			return { type: PromotionType.COUPON };
		case PromotionType.CUSTOMER_SPECIFIC:
			return {
				type: PromotionType.CUSTOMER_SPECIFIC,
				customerId: "",
			};
	}
}

export const promotionFormDefaults: PromotionFormValues = {
	name: "",
	type: PromotionType.SEASONAL,
	priority: 0,
	stackable: false,
	condition: defaultConditionFor(PromotionType.SEASONAL),
	effect: {
		type: PricingRuleEffectType.PERCENTAGE,
		value: 0,
	},
};

export function toCreatePromotionDto(
	values: PromotionFormValues,
): CreatePromotionDto {
	const condition =
		values.condition.type === PromotionType.SEASONAL
			? {
					type: PromotionType.SEASONAL,
					dateFrom: new Date(values.condition.dateFrom).toISOString(),
					dateTo: new Date(values.condition.dateTo).toISOString(),
				}
			: values.condition;

	return createPromotionSchema.parse({
		name: values.name.trim(),
		type: values.type,
		priority: values.priority,
		stackable: values.stackable,
		condition,
		effect: values.effect,
	});
}
