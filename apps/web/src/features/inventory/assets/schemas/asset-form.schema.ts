import { z } from "zod";
import { createAssetSchema, updateAssetSchema } from "@your-monorepo/shared";
import type { CreateAssetDto, UpdateAssetDto } from "@your-monorepo/shared";
import {
  emptyToNull,
  emptyToNullOrUndefined,
} from "@your-monorepo/web-shared-utils";

export const assetFormSchema = z.object({
  locationId: z.string().min(1, "Location is required"),
  productTypeId: z.string().min(1, "Product type is required"),
  ownerId: z.string().or(z.literal("")),
  serialNumber: z.string().or(z.literal("")),
  notes: z.string().or(z.literal("")),
  isActive: z.boolean(),
});

export type AssetFormValues = z.infer<typeof assetFormSchema>;

export const assetFormDefaults: AssetFormValues = {
  locationId: "",
  productTypeId: "",
  ownerId: "",
  serialNumber: "",
  notes: "",
  isActive: true,
};

export function assetToFormValues(asset: {
  locationId: string;
  productTypeId: string;
  ownerId: string | null;
  serialNumber: string | null;
  notes: string | null;
  isActive: boolean;
}): AssetFormValues {
  return {
    locationId: asset.locationId,
    productTypeId: asset.productTypeId,
    ownerId: asset.ownerId ?? "",
    serialNumber: asset.serialNumber ?? "",
    notes: asset.notes ?? "",
    isActive: asset.isActive,
  };
}

export function toCreateAssetDto(values: AssetFormValues): CreateAssetDto {
  const dto = {
    locationId: values.locationId,
    productTypeId: values.productTypeId,
    ownerId: emptyToNull(values.ownerId),
    serialNumber: emptyToNull(values.serialNumber),
    notes: emptyToNull(values.notes),
    isActive: values.isActive,
  };

  return createAssetSchema.parse(dto);
}

export function toUpdateAssetDto(
  dirtyValues: Partial<AssetFormValues>,
): UpdateAssetDto {
  const dto: UpdateAssetDto = {};

  if (dirtyValues.locationId !== undefined) {
    dto.locationId = dirtyValues.locationId;
  }
  if (dirtyValues.productTypeId !== undefined) {
    dto.productTypeId = dirtyValues.productTypeId;
  }
  if (dirtyValues.ownerId !== undefined) {
    dto.ownerId = emptyToNullOrUndefined(dirtyValues.ownerId);
  }
  if (dirtyValues.serialNumber !== undefined) {
    dto.serialNumber = emptyToNullOrUndefined(dirtyValues.serialNumber);
  }
  if (dirtyValues.notes !== undefined) {
    dto.notes = emptyToNullOrUndefined(dirtyValues.notes);
  }
  if (dirtyValues.isActive !== undefined) {
    dto.isActive = dirtyValues.isActive;
  }

  return updateAssetSchema.parse(dto);
}
