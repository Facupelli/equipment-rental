import { ContractBasis } from "@repo/types";
import z from "zod";

const contractBasisSchema = z.enum(ContractBasis);

export const createOwnerContractSchema = z
  .object({
    ownerId: z.uuid(),
    assetId: z.uuid().optional(),

    ownerShare: z.number().positive().max(1),
    rentalShare: z.number().positive().max(1),

    basis: contractBasisSchema.default(ContractBasis.NET_COLLECTED),

    validFrom: z.coerce.date(),
    validUntil: z.coerce.date().optional(),

    notes: z.string().trim().optional(),
    isActive: z.boolean().default(true),
  })
  .refine(({ ownerShare, rentalShare }) => ownerShare + rentalShare === 1, {
    message: "ownerShare and rentalShare must sum to exactly 1",
    path: ["rentalShare"],
  })
  .refine(
    ({ validFrom, validUntil }) =>
      validUntil === undefined || validUntil > validFrom,
    {
      message: "validUntil must be after validFrom",
      path: ["validUntil"],
    },
  );

export type CreateOwnerContractDto = z.infer<typeof createOwnerContractSchema>;
