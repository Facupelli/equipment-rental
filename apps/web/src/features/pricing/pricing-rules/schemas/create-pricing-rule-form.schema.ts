import {
  createPricingRuleSchema,
  type CreatePricingRuleDto,
} from "@repo/schemas";
import {
  PromotionAdjustmentType,
  PricingRuleScope,
  PricingRuleType,
} from "@repo/types";
import { z } from "zod";

const seasonalConditionFormSchema = z.object({
  type: z.literal(PricingRuleType.SEASONAL),
  dateFrom: z.string().min(1, "Fecha inicio es requerida"),
  dateTo: z.string().min(1, "Fecha fin es requerida"),
});

const volumeConditionFormSchema = z.object({
  type: z.literal(PricingRuleType.VOLUME),
  categoryId: z.uuid("Selecciona una categoría válida"),
  threshold: z.number().int().positive("El umbral debe ser mayor a 0"),
});

const couponConditionFormSchema = z.object({
  type: z.literal(PricingRuleType.COUPON),
});

const customerSpecificConditionFormSchema = z.object({
  type: z.literal(PricingRuleType.CUSTOMER_SPECIFIC),
  customerId: z.uuid("ID de cliente inválido"),
});

const durationTierFormSchema = z.object({
  fromDays: z.number().int().min(1, "Desde debe ser al menos 1"),
  toDays: z.number().int().min(1, "Hasta debe ser al menos 1").nullable(),
  discountPct: z
    .number()
    .min(0, "El descuento debe ser mayor o igual a 0")
    .max(100, "El descuento no puede superar 100%"),
});

const durationConditionFormSchema = z.object({
  type: z.literal(PricingRuleType.DURATION),
  tiers: z.array(durationTierFormSchema).min(1, "Agrega al menos un tramo"),
});

const conditionFormSchema = z.discriminatedUnion("type", [
  seasonalConditionFormSchema,
  volumeConditionFormSchema,
  couponConditionFormSchema,
  customerSpecificConditionFormSchema,
  durationConditionFormSchema,
]);

// ── Root form schema ──────────────────────────────────────────────────────────

export const pricingRuleFormSchema = z
  .object({
    name: z.string().min(1, "El nombre es requerido"),
    type: z.enum(PricingRuleType),
    scope: z.enum(PricingRuleScope),
    priority: z.number().int().min(0, "La prioridad debe ser 0 o mayor"),
    stackable: z.boolean(),
    condition: conditionFormSchema,
    effect: z.object({
      type: z.enum(PromotionAdjustmentType),
      value: z.number().min(0),
    }),
  })
  .superRefine((data, ctx) => {
    if (data.type !== PricingRuleType.DURATION && data.effect.value <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["effect", "value"],
        message: "El valor debe ser mayor a 0",
      });
    }
  });

export type PricingRuleFormValues = z.infer<typeof pricingRuleFormSchema>;

export function defaultConditionFor(
  type: PricingRuleType,
): PricingRuleFormValues["condition"] {
  switch (type) {
    case PricingRuleType.SEASONAL:
      return { type: PricingRuleType.SEASONAL, dateFrom: "", dateTo: "" };
    case PricingRuleType.VOLUME:
      return { type: PricingRuleType.VOLUME, categoryId: "", threshold: 1 };
    case PricingRuleType.COUPON:
      return { type: PricingRuleType.COUPON };
    case PricingRuleType.CUSTOMER_SPECIFIC:
      return { type: PricingRuleType.CUSTOMER_SPECIFIC, customerId: "" };
    case PricingRuleType.DURATION:
      return {
        type: PricingRuleType.DURATION,
        tiers: [{ fromDays: 1, toDays: null, discountPct: 0 }],
      };
  }
}

export const pricingRuleFormDefaults: PricingRuleFormValues = {
  name: "",
  type: PricingRuleType.SEASONAL,
  scope: PricingRuleScope.ORDER,
  priority: 0,
  stackable: false,
  condition: defaultConditionFor(PricingRuleType.SEASONAL),
  effect: {
    type: PromotionAdjustmentType.PERCENTAGE,
    value: 0,
  },
};

export function toCreatePricingRuleDto(
  values: PricingRuleFormValues,
): CreatePricingRuleDto {
  let condition = values.condition;

  if (condition.type === PricingRuleType.SEASONAL) {
    condition = {
      type: PricingRuleType.SEASONAL,
      dateFrom: new Date(condition.dateFrom).toISOString(),
      dateTo: new Date(condition.dateTo).toISOString(),
    };
  }

  if (condition.type === PricingRuleType.DURATION) {
    condition = {
      type: PricingRuleType.DURATION,
      tiers: condition.tiers.map((t) => ({
        fromDays: t.fromDays,
        toDays: t.toDays,
        discountPct: t.discountPct,
      })),
    };
  }

  const dto = {
    name: values.name.trim(),
    type: values.type,
    scope: values.scope,
    priority: values.priority,
    stackable: values.stackable,
    condition,
    effect: values.effect,
  };

  return createPricingRuleSchema.parse(dto);
}
