import z from "zod";

export const customerRegisterSchema = z
  .object({
    firstName: z.string().min(1, "First name is required."),
    lastName: z.string().min(1, "Last name is required."),
    email: z.email("Please enter a valid email address."),
    password: z
      .string()
      .min(1, "Password is required.")
      .min(8, "Password must be at least 8 characters."),
    isCompany: z.boolean(),
    companyName: z.string().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.isCompany && !data.companyName?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Company name is required.",
        path: ["companyName"],
      });
    }
  });

export type CustomerRegisterFormValues = z.infer<typeof customerRegisterSchema>;

export const customerRegisterDefaultValues: CustomerRegisterFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  isCompany: false,
  companyName: "",
};
