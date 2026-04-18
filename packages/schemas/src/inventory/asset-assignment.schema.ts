import { z } from "zod";

const createAssetAssignmentsBaseSchema = z.object({
  assetIds: z.array(z.uuid()).min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  reason: z.string().trim().min(1).nullable().optional(),
});

export const createBlackoutAssignmentsSchema = createAssetAssignmentsBaseSchema;

export const createMaintenanceAssignmentsSchema = createAssetAssignmentsBaseSchema;

export const createAssetAssignmentsResponseSchema = z.object({
  createdCount: z.number().int().nonnegative(),
});

export type CreateBlackoutAssignmentsDto = z.infer<typeof createBlackoutAssignmentsSchema>;
export type CreateMaintenanceAssignmentsDto = z.infer<typeof createMaintenanceAssignmentsSchema>;
export type CreateAssetAssignmentsResponseDto = z.infer<typeof createAssetAssignmentsResponseSchema>;
