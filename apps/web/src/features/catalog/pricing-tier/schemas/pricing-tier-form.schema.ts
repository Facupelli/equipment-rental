import { z } from "zod";

export const GLOBAL_LOCATION_VALUE = "global";

export const pricingTierFormSchema = z
  .object({
    // Either GLOBAL_LOCATION_VALUE or a location UUID.
    locationId: z.string().min(1, "Location scope is required"),
    fromUnit: z.number().int().positive("Must be greater than 0"),
    // Empty string in the input → null in the DTO (open-ended tier).
    toUnit: z.number().int().positive("Must be greater than 0").nullable(),
    pricePerUnit: z.number().positive("Must be greater than 0"),
  })
  .refine((data) => data.toUnit === null || data.toUnit > data.fromUnit, {
    message: "Must be greater than From",
    path: ["toUnit"],
  });

export type PricingTierFormValues = z.infer<typeof pricingTierFormSchema>;

export const pricingTierFormDefaults: PricingTierFormValues = {
  locationId: GLOBAL_LOCATION_VALUE,
  fromUnit: 1,
  toUnit: null,
  pricePerUnit: 0,
};

export interface CreatePricingTierDto {
  locationId: string | null;
  fromUnit: number;
  toUnit: number | null;
  pricePerUnit: string;
}

export interface AddPricingTiersDto {
  tiers: CreatePricingTierDto[];
}

export function toPricingTierDto(
  values: PricingTierFormValues,
): CreatePricingTierDto {
  return {
    locationId:
      values.locationId === GLOBAL_LOCATION_VALUE ? null : values.locationId,
    fromUnit: values.fromUnit,
    toUnit: values.toUnit,
    // Backend expects a regex-validated decimal string e.g. "24.99"
    pricePerUnit: values.pricePerUnit.toFixed(2),
  };
}

export function toAddPricingTiersDto(
  tiers: PricingTierFormValues[],
): AddPricingTiersDto {
  return { tiers: tiers.map(toPricingTierDto) };
}
