import { z } from "zod";

const customerCompanyRefinement = (
  data: { isCompany?: boolean | null; companyName?: string | null },
  ctx: z.RefinementCtx,
) => {
  if (data.isCompany && !data.companyName) {
    ctx.addIssue({
      code: "custom",
      message: "Company name is required for company accounts",
      path: ["companyName"],
    });
  }
};

export const createCustomerSchema = z
  .object({
    email: z.email("Invalid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    phone: z.string().nullable(),
    isCompany: z.boolean().default(false),
    companyName: z.string().nullable(),
    taxId: z.string().nullable(),
  })
  .superRefine(customerCompanyRefinement);

export const updateCustomerSchema = z
  .object({
    email: z.email("Invalid email").optional(),
    firstName: z.string().min(1, "First name is required").optional(),
    lastName: z.string().min(1, "Last name is required").optional(),
    phone: z.string().nullable().optional(),
    isCompany: z.boolean().optional(),
    companyName: z.string().nullable().optional(),
    taxId: z.string().nullable().optional(),
  })
  .superRefine(customerCompanyRefinement);

export const customerRegisterSchema = z
  .object({
    email: z.email("Invalid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    phone: z.string().nullable(),
    isCompany: z.boolean().default(false),
    companyName: z.string().nullable(),
    taxId: z.string().nullable(),
  })
  .superRefine(customerCompanyRefinement);

export type CreateCustomerDto = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerDto = z.infer<typeof updateCustomerSchema>;
export type CustomerRegisterDto = z.infer<typeof customerRegisterSchema>;
