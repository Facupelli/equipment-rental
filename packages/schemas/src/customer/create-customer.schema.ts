import { z } from "zod";
import { CustomerStatus } from "@repo/types";

export const customerStatusSchema = z.enum(CustomerStatus);

export const customerSchema = z.object({
  id: z.uuid(),
  tenantId: z.string(),
  name: z.string().min(1).max(255),
  email: z.email(),
  status: customerStatusSchema,
  phone: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createCustomerSchema = customerSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    status: customerStatusSchema.default(CustomerStatus.ACTIVE),
    phone: z.string().min(3).max(50).optional(),
  });

export type CreateCustomerSchema = z.infer<typeof createCustomerSchema>;
