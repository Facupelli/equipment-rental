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

export const step2Schema = z
	.object({
		identityDocumentFile: z.instanceof(File).nullable(),
		existingIdentityDocumentPath: z.string().min(1).nullable(),
		address: z.string().min(4, "Ingresá tu domicilio"),
		city: z.string().min(2, "Ingresá tu localidad"),
		stateRegion: z.string().min(2, "Ingresá tu provincia o región"),
		country: z.string().min(2, "Ingresá tu país"),
	})
	.superRefine((data, ctx) => {
		if (data.identityDocumentFile || data.existingIdentityDocumentPath) {
			return;
		}

		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ["identityDocumentFile"],
			message: "Subí tu documento o conservá el archivo actual",
		});
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
	.extend(step4Schema.shape)
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

		if (!data.identityDocumentFile && !data.existingIdentityDocumentPath) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["identityDocumentFile"],
				message: "Subí tu documento o conservá el archivo actual",
			});
		}
	});

export type OnboardFormValues = z.infer<typeof customerFormSchema>;

export interface OnboardPrefillValues {
	fullName: string;
	phone: string;
	birthDate: string;
	documentNumber: string;
	existingIdentityDocumentPath: string | null;
	address: string;
	city: string;
	stateRegion: string;
	country: string;
	occupation?: string;
	company?: string;
	taxId?: string;
	businessName?: string;
	bankName?: string;
	accountNumber?: string;
	contact1Name: string;
	contact1Relationship: string;
	contact2Name?: string;
	contact2Relationship?: string;
}

export const customerFormValues: OnboardFormValues = {
	fullName: "",
	phone: "",
	birthDate: "",
	documentNumber: "",
	identityDocumentFile: null,
	existingIdentityDocumentPath: null,
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

export function createOnboardFormValues(
	overrides: Partial<OnboardFormValues> = {},
): OnboardFormValues {
	return {
		...customerFormValues,
		...overrides,
	};
}

export function createOnboardPrefillValues(
	overrides: Partial<OnboardPrefillValues> = {},
): OnboardPrefillValues {
	const { identityDocumentFile: _identityDocumentFile, ...prefillValues } =
		customerFormValues;

	return {
		...prefillValues,
		...overrides,
	};
}

export function toOnboardFormValues(
	prefillValues: OnboardPrefillValues,
): OnboardFormValues {
	return createOnboardFormValues({
		...prefillValues,
		identityDocumentFile: null,
	});
}

// ---------------------------------------------------------------------------
// Per-step field names — used to scope validation to the active step
// ---------------------------------------------------------------------------
export const stepFields = {
	1: ["fullName", "phone", "birthDate", "documentNumber"] as const,
	2: [
		"identityDocumentFile",
		"existingIdentityDocumentPath",
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
