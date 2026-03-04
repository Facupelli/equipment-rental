import z from "zod";
import { nullableOptional } from "../shared";

// Base object — no refine here
const CustomerBaseSchema = z.object({
  id: z.uuid(),
  tenantId: z.uuid(),
  email: z.email(),
  passwordHash: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  phone: nullableOptional(z.string()),
  isCompany: z.boolean().default(false),
  companyName: nullableOptional(z.string()),
  taxId: nullableOptional(z.string()),
  isActive: z.boolean().default(true),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date(),
  deletedAt: nullableOptional(z.date()),
});

// Reusable refine — keeps things DRY
const companyNameRefine = (data: {
  isCompany?: boolean;
  companyName?: string | null;
}) => {
  if (data.isCompany) {
    return data.companyName != null && data.companyName.length > 0;
  }
  return true;
};

const companyNameRefinement = {
  message: "companyName is required when isCompany is true",
  path: ["companyName"],
};

// Now omit first, then refine
export const CustomerSchema = CustomerBaseSchema.refine(
  companyNameRefine,
  companyNameRefinement,
);

export const CustomerCreateSchema = CustomerBaseSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
}).refine(companyNameRefine, companyNameRefinement);

export const CustomerUpdateSchema = CustomerBaseSchema.partial()
  .omit({
    id: true,
    tenantId: true,
    createdAt: true,
    deletedAt: true,
  })
  .refine(companyNameRefine, companyNameRefinement);

export type Customer = z.infer<typeof CustomerSchema>;
export type CustomerCreate = z.infer<typeof CustomerCreateSchema>;
export type CustomerUpdate = z.infer<typeof CustomerUpdateSchema>;
