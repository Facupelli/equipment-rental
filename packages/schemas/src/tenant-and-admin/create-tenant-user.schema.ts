import { z } from "zod";

export const createTenantUserSchema = z.object({
  // User fields
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),

  // Tenant fields
  companyName: z.string().min(2, "Company name is required"),
});

export type CreateTenantUserDto = z.infer<typeof createTenantUserSchema>;

export const registerResponseSchema = z.object({
  userId: z.uuid(),
  tenantId: z.uuid(),
});

export type RegisterResponseDto = z.infer<typeof registerResponseSchema>;
