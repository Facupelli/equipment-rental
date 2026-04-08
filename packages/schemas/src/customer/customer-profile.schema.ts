import { z } from "zod";

export const customerProfileSchema = z.object({
	fullName: z.string().min(1),
	phone: z.string().min(1),
	birthDate: z.iso.date(),
	documentNumber: z.string().min(1),
	identityDocumentPath: z.string().min(1),
	address: z.string().min(1),
	city: z.string().min(1),
	stateRegion: z.string().min(1),
	country: z.string().min(1),
	occupation: z.string(),
	company: z.string().nullable(),
	taxId: z.string().nullable(),
	businessName: z.string().nullable(),
	bankName: z.string(),
	accountNumber: z.string(),
	contact1Name: z.string().min(1),
	contact1Relationship: z.string().min(1),
	contact2Name: z.string(),
	contact2Relationship: z.string(),
});

export type CustomerProfile = z.infer<typeof customerProfileSchema>;

// RESPONSE

// customer-profile.response.dto.ts

export const CustomerProfileResponseSchema = z.object({
	id: z.uuid(),
	status: z.string(),
	submittedAt: z.date(),

	// Personal
	fullName: z.string(),
	phone: z.string(),
	birthDate: z.date(),
	documentNumber: z.string(),

	// Address
	address: z.string(),
	city: z.string(),
	stateRegion: z.string(),
	country: z.string(),

	// Professional
	occupation: z.string(),
	company: z.string().nullable(),
	taxId: z.string().nullable(),

	// Bank
	bankName: z.string(),
	accountNumber: z.string(),

	// Review
	rejectionReason: z.string().nullable(),
});

export type CustomerProfileResponseDto = z.infer<
	typeof CustomerProfileResponseSchema
>;
