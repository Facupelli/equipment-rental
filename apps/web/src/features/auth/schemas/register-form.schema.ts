import { z } from "zod";
import { registerSchema } from "@your-monorepo/shared";
import type { RegisterDto } from "@your-monorepo/shared";

export const registerFormSchema = z
  .object({
    tenantName: z.string().min(1, "Tenant name is required"),
    email: z.email("Invalid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerFormSchema>;

export const registerFormDefaults: RegisterFormValues = {
  tenantName: "",
  email: "",
  password: "",
  confirmPassword: "",
  firstName: "",
  lastName: "",
};

export function toRegisterDto(values: RegisterFormValues): RegisterDto {
  const dto = {
    tenant: {
      name: values.tenantName.trim(),
    },
    user: {
      email: values.email.trim(),
      password: values.password,
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
    },
  };

  return registerSchema.parse(dto);
}
