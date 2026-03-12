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

export const registerCustomerSchema = z
  .object({
    tenantId: z.uuid(),
    email: z.email("Invalid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    isCompany: z.boolean().default(false),
    companyName: z.string().nullable(),
  })
  .superRefine(customerCompanyRefinement);

export const loginCustomerSchema = z.object({
  tenantId: z.uuid(),
  email: z.email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type RegisterCustomerDto = z.infer<typeof registerCustomerSchema>;
export type LoginCustomerDto = z.infer<typeof loginCustomerSchema>;
