import { z } from "zod";

export const createCouponSchema = z
  .object({
    promotionId: z.uuid(),
    code: z.string().min(1).trim().toUpperCase(),
    maxUses: z.number().int().positive().optional(),
    maxUsesPerCustomer: z.number().int().positive().optional(),
    restrictedToCustomerId: z.uuid().optional(),
    validFrom: z.coerce.date().optional(),
    validUntil: z.coerce.date().optional(),
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
        message: "validUntil must be strictly after validFrom",
      });
    }

    if (
      data.maxUses !== undefined &&
      data.maxUsesPerCustomer !== undefined &&
      data.maxUsesPerCustomer > data.maxUses
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["maxUsesPerCustomer"],
        message: "maxUsesPerCustomer cannot exceed maxUses",
      });
    }
  });

export type CreateCouponDto = z.infer<typeof createCouponSchema>;
