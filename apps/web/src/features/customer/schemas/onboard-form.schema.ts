import z from "zod";

export const step1Schema = z.object({
  fullName: z.string().min(2, "Ingresá tu nombre completo"),
  phone: z
    .string()
    .min(7, "Ingresá un número de teléfono válido")
    .regex(
      /^\+?[\d\s\-().]{7,20}$/,
      "Formato inválido. Incluí el código de área",
    ),
  birthDate: z.string().min(1, "Ingresá tu fecha de nacimiento"),
  documentNumber: z
    .string()
    .min(5, "Ingresá tu número de documento")
    .regex(/^\d+$/, "Solo números, sin puntos ni espacios"),
});

export const step2Schema = z.object({
  identityDocumentFile: z.instanceof(File).nullable(),
  address: z.string().min(4, "Ingresá tu domicilio"),
  city: z.string().min(2, "Ingresá tu localidad"),
  stateRegion: z.string().min(2, "Ingresá tu provincia o región"),
  country: z.string().min(2, "Ingresá tu país"),
});

export const step3Schema = z.object({
  occupation: z.string().optional(),
  company: z.string().optional(),
  taxId: z.string().optional(),
  businessName: z.string().optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
});

// Contact 2 fields are optional, but must be filled together (both or neither)
export const step4Schema = z
  .object({
    contact1Name: z.string().min(2, "Ingresá el nombre del contacto"),
    contact1Relationship: z.string().min(2, "Ingresá el vínculo"),
    contact2Name: z.string().optional(),
    contact2Relationship: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const hasName = (data.contact2Name ?? "").trim().length > 0;
    const hasRel = (data.contact2Relationship ?? "").trim().length > 0;

    if (hasName && !hasRel) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["contact2Relationship"],
        message: "Ingresá el vínculo del segundo contacto",
      });
    }

    if (hasRel && !hasName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["contact2Name"],
        message: "Ingresá el nombre del segundo contacto",
      });
    }
  });

// ---------------------------------------------------------------------------
// Full form schema — union of all steps
// ---------------------------------------------------------------------------
export const customerFormSchema = step1Schema
  .extend(step2Schema.shape)
  .extend(step3Schema.shape)
  .extend(step4Schema.shape);

export type OnboardFormValues = z.infer<typeof customerFormSchema>;

export const customerFormValues: OnboardFormValues = {
  fullName: "",
  phone: "",
  birthDate: "",
  documentNumber: "",
  identityDocumentFile: null,
  address: "",
  city: "",
  stateRegion: "",
  country: "",
  occupation: "",
  company: "",
  taxId: "",
  businessName: "",
  bankName: "",
  accountNumber: "",
  contact1Name: "",
  contact1Relationship: "",
  contact2Name: "",
  contact2Relationship: "",
};

// ---------------------------------------------------------------------------
// Per-step field names — used to scope validation to the active step
// ---------------------------------------------------------------------------
export const stepFields = {
  1: ["fullName", "phone", "birthDate", "documentNumber"] as const,
  2: [
    "identityDocumentFile",
    "address",
    "city",
    "stateRegion",
    "country",
  ] as const,
  3: [
    "occupation",
    "company",
    "taxId",
    "businessName",
    "bankName",
    "accountNumber",
  ] as const,
  4: [
    "contact1Name",
    "contact1Relationship",
    "contact2Name",
    "contact2Relationship",
  ] as const,
} as const;

export type StepNumber = keyof typeof stepFields;
