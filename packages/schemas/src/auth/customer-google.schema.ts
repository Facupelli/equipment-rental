import { z } from "zod";

export const issueCustomerGoogleAuthStateSchema = z.object({
	tenantId: z.uuid(),
	portalOrigin: z.url(),
	redirectPath: z.string().startsWith("/"),
});

export const customerGoogleAuthStateResponseSchema = z.object({
	state: z.string().min(1),
});

export const authenticateCustomerWithGoogleSchema = z.object({
	code: z.string().min(1),
	redirectUri: z.url(),
	state: z.string().min(1),
	codeVerifier: z.string().min(1).optional(),
});

export const authenticateCustomerWithGoogleResponseSchema = z.object({
	handoff_token: z.string().min(1),
	portal_origin: z.url(),
});

export const exchangeCustomerGoogleHandoffSchema = z.object({
	handoffToken: z.string().min(1),
});

export const exchangeCustomerGoogleHandoffResponseSchema = z.object({
	access_token: z.string().min(1),
	refresh_token: z.string().min(1),
});

export type IssueCustomerGoogleAuthStateDto = z.infer<
	typeof issueCustomerGoogleAuthStateSchema
>;
export type CustomerGoogleAuthStateResponseDto = z.infer<
	typeof customerGoogleAuthStateResponseSchema
>;
export type AuthenticateCustomerWithGoogleDto = z.infer<
	typeof authenticateCustomerWithGoogleSchema
>;
export type AuthenticateCustomerWithGoogleResponseDto = z.infer<
	typeof authenticateCustomerWithGoogleResponseSchema
>;
export type ExchangeCustomerGoogleHandoffDto = z.infer<
	typeof exchangeCustomerGoogleHandoffSchema
>;
export type ExchangeCustomerGoogleHandoffResponseDto = z.infer<
	typeof exchangeCustomerGoogleHandoffResponseSchema
>;
