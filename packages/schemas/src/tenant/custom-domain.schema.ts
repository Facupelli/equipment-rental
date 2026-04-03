import { CustomDomainStatus } from "@repo/types";
import { z } from "zod";

export const customDomainStatusSchema = z.enum(CustomDomainStatus);

export const customDomainResponseSchema = z.object({
	domain: z.string(),
	status: customDomainStatusSchema,
	verifiedAt: z.iso.datetime().nullable(),
	lastError: z.string().nullable(),
});

export const registerCustomDomainSchema = z.object({
	domain: z.string().min(1),
});

export const registerCustomDomainResponseSchema = z.object({
	domain: z.string(),
	status: customDomainStatusSchema,
	cnameTarget: z.string(),
});

export type CustomDomainResponse = z.infer<typeof customDomainResponseSchema>;
export type RegisterCustomDomainDto = z.infer<
	typeof registerCustomDomainSchema
>;
export type RegisterCustomDomainResponse = z.infer<
	typeof registerCustomDomainResponseSchema
>;
