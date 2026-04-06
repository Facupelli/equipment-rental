import { z } from "zod";

export const updateTenantBrandingSchema = z.object({
	logoUrl: z.string().trim().min(1).nullable(),
});

export type UpdateTenantBrandingDto = z.infer<
	typeof updateTenantBrandingSchema
>;
