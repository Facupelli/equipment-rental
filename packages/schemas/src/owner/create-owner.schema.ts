import { z } from "zod";

const PayoutDetailsSchema = z.object({
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  routingNumber: z.string().optional(),
  splitPercentage: z.number().min(0).max(100).optional(),
  paypalEmail: z.string().email().optional(),
});

export const CreateOwnerSchema = z.object({
  name: z.string().min(1, "Owner name is required"),
  payoutDetails: PayoutDetailsSchema,
});

export type CreateOwnerDto = z.infer<typeof CreateOwnerSchema>;
