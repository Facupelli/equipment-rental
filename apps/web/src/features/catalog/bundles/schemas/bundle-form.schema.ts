import { CreateBundleSchema, type CreateBundleDto } from "@repo/schemas";
import { z } from "zod";

const bundleComponentFormSchema = z.object({
  productTypeId: z.uuid("Invalid product type"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  // Display-only fields — present in form state, stripped before DTO mapping.
  name: z.string(),
  subtitle: z.string(),
  // Upper bound for the quantity stepper. Equals the active asset count for
  // this product type at the time it was added to the bundle.
  assetCount: z.number().int().nonnegative(),
});

export const bundleFormSchema = z.object({
  name: z.string().min(1, "Bundle name is required"),
  billingUnitId: z.uuid("Billing unit is required"),
  isActive: z.boolean(),
  components: z
    .array(bundleComponentFormSchema)
    .min(1, "At least one component is required"),
});

export type BundleComponentFormValues = z.infer<
  typeof bundleComponentFormSchema
>;
export type BundleFormValues = z.infer<typeof bundleFormSchema>;

export const bundleFormDefaults: BundleFormValues = {
  name: "",
  billingUnitId: "",
  isActive: true,
  components: [],
};

export function toCreateBundleDto(values: BundleFormValues): CreateBundleDto {
  const dto = {
    name: values.name,
    billingUnitId: values.billingUnitId,
    isActive: values.isActive,
    // Strip display-only fields — only send what the backend expects.
    components: values.components.map(({ productTypeId, quantity }) => ({
      productTypeId,
      quantity,
    })),
  };

  // Re-validate against the backend schema to guarantee contract alignment.
  return CreateBundleSchema.parse(dto);
}
