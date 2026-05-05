import { z } from "zod";

export const RENTAL_AGREEMENT_ACCEPTANCE_TEXT_VERSION =
	"rental-agreement-v1" as const;

export const documentSigningTokenSchema = z.object({
	token: z.string().trim().min(1),
});

export type DocumentSigningTokenInput = z.infer<
	typeof documentSigningTokenSchema
>;

export const orderSigningSessionParamsSchema = z.object({
	orderId: z.uuid(),
});

export type OrderSigningSessionParams = z.infer<
	typeof orderSigningSessionParamsSchema
>;

export const sendOrderSigningInvitationSchema = z.object({
	recipientEmail: z.string().trim().email(),
});

export type SendOrderSigningInvitationDto = z.infer<
	typeof sendOrderSigningInvitationSchema
>;

export const orderSigningSessionResponseSchema = z.object({
	requestId: z.uuid(),
	documentNumber: z.string(),
	recipientEmail: z.string().trim().email(),
	expiresAt: z.string().datetime({ offset: true }),
	documentHash: z.string(),
	reusedExistingRequest: z.boolean(),
});

export type OrderSigningSessionResponseDto = z.infer<
	typeof orderSigningSessionResponseSchema
>;

export const publicSigningSessionResolveResponseSchema = z.object({
	requestId: z.uuid(),
});

export type PublicSigningSessionResolveResponseDto = z.infer<
	typeof publicSigningSessionResolveResponseSchema
>;

export const publicSigningDocumentSchema = z.object({
	documentNumber: z.string(),
	displayFileName: z.string(),
	contentType: z.literal("application/pdf"),
	byteSize: z.number().int().nonnegative(),
	sha256: z.string(),
});

export const publicSigningPrefilledSignerSchema = z.object({
	fullName: z.string().nullable(),
	documentNumber: z.string().nullable(),
});

export const publicSigningSessionStatusSchema = z.enum([
	"PENDING",
	"SIGNED",
	"VOIDED",
]);

export const publicSigningSessionResponseSchema = z.object({
	requestId: z.uuid(),
	documentType: z.literal("RENTAL_AGREEMENT"),
	status: publicSigningSessionStatusSchema,
	expiresAt: z.string().datetime({ offset: true }),
	document: publicSigningDocumentSchema,
	prefilledSigner: publicSigningPrefilledSignerSchema,
});

export type PublicSigningSessionResponseDto = z.infer<
	typeof publicSigningSessionResponseSchema
>;

export const acceptPublicSigningSessionSchema = z.object({
	signatureImageDataUrl: z
		.string()
		.trim()
		.min(1)
		.max(350_000)
		.regex(/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/),
	acceptanceTextVersion: z.string().trim().min(1),
	accepted: z.literal(true),
});

export type AcceptPublicSigningSessionDto = z.infer<
	typeof acceptPublicSigningSessionSchema
>;

export const acceptPublicSigningSessionResponseSchema = z.object({
	requestId: z.uuid(),
	status: z.literal("SIGNED"),
	signedAt: z.string().datetime({ offset: true }),
});

export type AcceptPublicSigningSessionResponseDto = z.infer<
	typeof acceptPublicSigningSessionResponseSchema
>;
