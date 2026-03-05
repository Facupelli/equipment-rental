import { z } from "zod";

export const createTenantSchema = z.object({
  name: z.string().min(1, "Tenant name is required"),
});

export const createUserSchema = z.object({
  email: z.email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

export const registerSchema = z.object({
  tenant: createTenantSchema,
  user: createUserSchema,
});

export type CreateTenantDto = z.infer<typeof createTenantSchema>;
export type CreateUserDto = z.infer<typeof createUserSchema>;
export type RegisterDto = z.infer<typeof registerSchema>;
