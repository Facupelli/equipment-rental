import z from "zod";

export const CustomerSchema = z
  .object({
    id: z.uuid(),
    tenantId: z.uuid(),
    email: z.email(),
    passwordHash: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    phone: z.string().nullable().optional(),
    isCompany: z.boolean().default(false),
    companyName: z.string().nullable().optional(),
    taxId: z.string().nullable().optional(),
    isActive: z.boolean().default(true),
    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date(),
    deletedAt: z.date().nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.isCompany) {
        return (
          data.companyName !== null &&
          data.companyName !== undefined &&
          data.companyName.length > 0
        );
      }
      return true;
    },
    {
      message: "companyName is required when isCompany is true",
      path: ["companyName"],
    },
  );

export const CustomerCreateSchema = CustomerSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export const CustomerUpdateSchema = CustomerSchema.partial().omit({
  id: true,
  tenantId: true,
  createdAt: true,
  deletedAt: true,
});

export type Customer = z.infer<typeof CustomerSchema>;
export type CustomerCreate = z.infer<typeof CustomerCreateSchema>;
export type CustomerUpdate = z.infer<typeof CustomerUpdateSchema>;
