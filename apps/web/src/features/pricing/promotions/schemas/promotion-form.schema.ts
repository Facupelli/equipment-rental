import { createPromotionSchema, type CreatePromotionDto } from "@repo/schemas";
import {
	PromotionActivationType,
	PromotionApplicabilityTarget,
	PromotionConditionType,
	PromotionEffectType,
	PromotionStackingType,
} from "@repo/types";
import { z } from "zod";

const requiredUuidSchema = z.uuid("Ingresa un UUID valido");

const bookingWindowConditionFormSchema = z.object({
	type: z.literal(PromotionConditionType.BOOKING_WINDOW),
	from: z.string().min(1, "La fecha desde es obligatoria"),
	to: z.string().min(1, "La fecha hasta es obligatoria"),
});

const rentalWindowConditionFormSchema = z.object({
	type: z.literal(PromotionConditionType.RENTAL_WINDOW),
	from: z.string().min(1, "La fecha desde es obligatoria"),
	to: z.string().min(1, "La fecha hasta es obligatoria"),
});

const customerIdInConditionFormSchema = z.object({
	type: z.literal(PromotionConditionType.CUSTOMER_ID_IN),
	customerIds: z.array(requiredUuidSchema).min(1, "Agrega al menos un cliente"),
});

const minSubtotalConditionFormSchema = z.object({
	type: z.literal(PromotionConditionType.MIN_SUBTOTAL),
	amount: z.number().positive("El monto debe ser mayor a 0"),
	currency: z.string().trim().length(3, "Usa una moneda de 3 letras"),
});

const rentalDurationMinConditionFormSchema = z.object({
	type: z.literal(PromotionConditionType.RENTAL_DURATION_MIN),
	minUnits: z
		.number()
		.int()
		.positive("Las unidades minimas deben ser mayores a 0"),
});

const categoryItemQuantityConditionFormSchema = z.object({
	type: z.literal(PromotionConditionType.CATEGORY_ITEM_QUANTITY),
	categoryId: requiredUuidSchema,
	minQuantity: z
		.number()
		.int()
		.positive("La cantidad minima debe ser mayor a 0"),
});

const distinctCategoriesWithMinQuantityConditionFormSchema = z.object({
	type: z.literal(PromotionConditionType.DISTINCT_CATEGORIES_WITH_MIN_QUANTITY),
	categoryIds: z
		.array(requiredUuidSchema)
		.min(1, "Agrega al menos una categoria"),
	minCategoriesMatched: z
		.number()
		.int()
		.positive("La cantidad minima de categorias debe ser mayor a 0"),
	minQuantityPerCategory: z
		.number()
		.int()
		.positive("La cantidad minima por categoria debe ser mayor a 0"),
});

export const promotionConditionFormSchema = z.discriminatedUnion("type", [
	bookingWindowConditionFormSchema,
	rentalWindowConditionFormSchema,
	customerIdInConditionFormSchema,
	minSubtotalConditionFormSchema,
	rentalDurationMinConditionFormSchema,
	categoryItemQuantityConditionFormSchema,
	distinctCategoriesWithMinQuantityConditionFormSchema,
]);

const percentOffEffectFormSchema = z.object({
	type: z.literal(PromotionEffectType.PERCENT_OFF),
	percentage: z.number().positive("El porcentaje debe ser mayor a 0").max(100),
});

const longRentalTierSchema = z.object({
	fromUnits: z
		.number()
		.int()
		.positive("El tramo debe empezar en una unidad valida"),
	toUnits: z
		.number()
		.int()
		.positive("El tramo debe terminar en una unidad valida")
		.nullable(),
	percentage: z.number().positive("El porcentaje debe ser mayor a 0").max(100),
});

const longRentalTieredPercentOffEffectFormSchema = z.object({
	type: z.literal(PromotionEffectType.LONG_RENTAL_TIERED_PERCENT_OFF),
	tiers: z.array(longRentalTierSchema).min(1, "Agrega al menos un tramo"),
});

export const promotionEffectFormSchema = z.discriminatedUnion("type", [
	percentOffEffectFormSchema,
	longRentalTieredPercentOffEffectFormSchema,
]);

export const promotionFormSchema = z
	.object({
		name: z.string().trim().min(1, "El nombre es obligatorio"),
		activationType: z.enum(PromotionActivationType),
		priority: z.number().int().min(0, "La prioridad debe ser 0 o mayor"),
		stackingType: z.enum(PromotionStackingType),
		validFrom: z.string().optional(),
		validUntil: z.string().optional(),
		conditions: z.array(promotionConditionFormSchema),
		applicability: z.object({
			appliesTo: z
				.array(z.enum(PromotionApplicabilityTarget))
				.min(1, "Selecciona al menos un destino"),
			excludedProductTypeIds: z.array(requiredUuidSchema),
			excludedBundleIds: z.array(requiredUuidSchema),
		}),
		effect: promotionEffectFormSchema,
	})
	.superRefine((data, ctx) => {
		if (
			data.validFrom &&
			data.validUntil &&
			data.validFrom >= data.validUntil
		) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["validUntil"],
				message: "La fecha hasta debe ser posterior a la fecha desde",
			});
		}

		data.conditions.forEach((condition, index) => {
			if (
				(condition.type === PromotionConditionType.BOOKING_WINDOW ||
					condition.type === PromotionConditionType.RENTAL_WINDOW) &&
				condition.from >= condition.to
			) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ["conditions", index, "to"],
					message: "La fecha hasta debe ser posterior a la fecha desde",
				});
			}
		});
	});

export type PromotionFormValues = z.infer<typeof promotionFormSchema>;
export type PromotionConditionFormValues =
	PromotionFormValues["conditions"][number];

export function defaultConditionFor(
	type: PromotionConditionType,
): PromotionConditionFormValues {
	switch (type) {
		case PromotionConditionType.BOOKING_WINDOW:
			return { type, from: "", to: "" };
		case PromotionConditionType.RENTAL_WINDOW:
			return { type, from: "", to: "" };
		case PromotionConditionType.CUSTOMER_ID_IN:
			return { type, customerIds: [""] };
		case PromotionConditionType.MIN_SUBTOTAL:
			return { type, amount: 0, currency: "USD" };
		case PromotionConditionType.RENTAL_DURATION_MIN:
			return { type, minUnits: 1 };
		case PromotionConditionType.CATEGORY_ITEM_QUANTITY:
			return { type, categoryId: "", minQuantity: 1 };
		case PromotionConditionType.DISTINCT_CATEGORIES_WITH_MIN_QUANTITY:
			return {
				type,
				categoryIds: [""],
				minCategoriesMatched: 1,
				minQuantityPerCategory: 1,
			};
		default:
			return assertNever(type);
	}
}

export function defaultEffectFor(
	type: PromotionEffectType,
): PromotionFormValues["effect"] {
	switch (type) {
		case PromotionEffectType.PERCENT_OFF:
			return { type, percentage: 10 };
		case PromotionEffectType.LONG_RENTAL_TIERED_PERCENT_OFF:
			return {
				type,
				tiers: [
					{
						fromUnits: 1,
						toUnits: null,
						percentage: 10,
					},
				],
			};
		default:
			return assertNever(type);
	}
}

export const promotionFormDefaults: PromotionFormValues = {
	name: "",
	activationType: PromotionActivationType.AUTOMATIC,
	priority: 0,
	stackingType: PromotionStackingType.EXCLUSIVE,
	validFrom: "",
	validUntil: "",
	conditions: [],
	applicability: {
		appliesTo: [PromotionApplicabilityTarget.PRODUCT],
		excludedProductTypeIds: [],
		excludedBundleIds: [],
	},
	effect: defaultEffectFor(PromotionEffectType.PERCENT_OFF),
};

export function toCreatePromotionDto(
	values: PromotionFormValues,
): CreatePromotionDto {
	return createPromotionSchema.parse({
		name: values.name.trim(),
		activationType: values.activationType,
		priority: values.priority,
		stackingType: values.stackingType,
		validFrom: toOptionalDate(values.validFrom),
		validUntil: toOptionalDate(values.validUntil),
		conditions: values.conditions.map((condition) => {
			switch (condition.type) {
				case PromotionConditionType.BOOKING_WINDOW:
				case PromotionConditionType.RENTAL_WINDOW:
					return {
						...condition,
						from: toDateTime(condition.from),
						to: toDateTime(condition.to),
					};
				case PromotionConditionType.MIN_SUBTOTAL:
					return {
						...condition,
						currency: condition.currency.trim().toUpperCase(),
					};
				default:
					return condition;
			}
		}),
		applicability: {
			appliesTo: values.applicability.appliesTo,
			excludedProductTypeIds: values.applicability.excludedProductTypeIds,
			excludedBundleIds: values.applicability.excludedBundleIds,
		},
		effect: values.effect,
	});
}

function toOptionalDate(value?: string) {
	if (!value?.trim()) {
		return undefined;
	}

	return new Date(value);
}

function toDateTime(value: string) {
	return new Date(value).toISOString();
}

function assertNever(value: never): never {
	throw new Error(`Unhandled promotion variant: ${value}`);
}
