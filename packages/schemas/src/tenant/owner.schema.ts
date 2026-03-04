import z from "zod";
import { nullableOptional } from "../shared";

export const OwnerSchema = z.object({
  id: z.uuid(),
  tenantId: z.uuid(),
  name: z.string(),
  email: nullableOptional(z.string()),
  phone: nullableOptional(z.string()),
  notes: nullableOptional(z.string()),
  isActive: z.boolean().default(true),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date(),
});

export const OwnerCreateSchema = OwnerSchema.omit({
  id: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true,
});

export const OwnerUpdateSchema = OwnerSchema.partial().omit({
  id: true,
  tenantId: true,
  createdAt: true,
});

export type Owner = z.infer<typeof OwnerSchema>;
export type OwnerCreate = z.infer<typeof OwnerCreateSchema>;
export type OwnerUpdate = z.infer<typeof OwnerUpdateSchema>;

export const OwnerListResponseSchema = z.array(OwnerSchema);
export type OwnerListResponse = z.infer<typeof OwnerListResponseSchema>;
