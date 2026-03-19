import { ContractBasis } from "@repo/types";
import z from "zod";

const contractBasisSchema = z.enum(ContractBasis);

export const getOwnerContractsResponseSchema = z.object({
  id: z.uuid(),
  ownerId: z.uuid(),
  assetId: z.uuid().nullable(),
  ownerShare: z.number(),
  rentalShare: z.number(),
  basis: contractBasisSchema,
  validFrom: z.date(),
  validUntil: z.date().nullable(),
  notes: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type GetOwnerContractsResponseDto = z.infer<
  typeof getOwnerContractsResponseSchema
>;

export const getOwnerResponseSchema = z.object({
  id: z.uuid(),
  tenantId: z.uuid(),
  name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  notes: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
  contracts: z.array(getOwnerContractsResponseSchema),
});

export type GetOwnerResponseDto = z.infer<typeof getOwnerResponseSchema>;
