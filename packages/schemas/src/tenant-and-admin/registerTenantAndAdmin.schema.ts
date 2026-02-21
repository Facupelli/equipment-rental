import { z } from "zod";

export const registerTenantAndAdminSchema = z.object({
  // User fields
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),

  // Tenant fields
  companyName: z.string().min(2, "Company name is required"),
  companySlug: z
    .string()
    .min(2)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens",
    ),
});

export type RegisterTenantAndAdminDto = z.infer<
  typeof registerTenantAndAdminSchema
>;
