import z from "zod";

export const createOwnerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email").nullable(),
  phone: z.string().nullable(),
  notes: z.string().nullable(),
  isActive: z.boolean().default(true),
});

export const updateOwnerSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.email("Invalid email").nullable().optional(),
  phone: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export type CreateOwnerDto = z.infer<typeof createOwnerSchema>;
export type UpdateOwnerDto = z.infer<typeof updateOwnerSchema>;
