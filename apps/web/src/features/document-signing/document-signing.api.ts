import type { ProblemDetails } from "@repo/schemas";
import { createServerFn } from "@tanstack/react-start";
import { apiFetch } from "@/lib/api";
import { authenticatedApiFetch } from "@/lib/api-auth";
import { ProblemDetailsError } from "@/shared/errors";
import {
	type AcceptPublicSigningSessionDto,
	type AcceptPublicSigningSessionResponseDto,
	acceptPublicSigningSessionResponseSchema,
	acceptPublicSigningSessionSchema,
	type DocumentSigningTokenInput,
	documentSigningTokenSchema,
	type OrderSigningSessionParams,
	type OrderSigningSessionResponseDto,
	orderSigningSessionParamsSchema,
	orderSigningSessionResponseSchema,
	type PublicSigningSessionResolveResponseDto,
	type PublicSigningSessionResponseDto,
	publicSigningSessionResolveResponseSchema,
	publicSigningSessionResponseSchema,
	type SendOrderSigningInvitationDto,
	sendOrderSigningInvitationSchema,
} from "./document-signing.schema";

const documentSigningApiUrl = "/document-signing";

export const createOrderSigningSession = createServerFn({ method: "POST" })
	.inputValidator(
		(data: {
			params: OrderSigningSessionParams;
			dto: SendOrderSigningInvitationDto;
		}) => ({
			params: orderSigningSessionParamsSchema.parse(data.params),
			dto: sendOrderSigningInvitationSchema.parse(data.dto),
		}),
	)
	.handler(
		async ({
			data,
		}): Promise<OrderSigningSessionResponseDto | { error: ProblemDetails }> => {
			try {
				const response =
					await authenticatedApiFetch<OrderSigningSessionResponseDto>(
						`${documentSigningApiUrl}/orders/${data.params.orderId}/sessions`,
						{
							method: "POST",
							body: data.dto,
						},
					);

				return orderSigningSessionResponseSchema.parse(response);
			} catch (error) {
				if (error instanceof ProblemDetailsError) {
					return { error: error.problemDetails };
				}

				throw error;
			}
		},
	);

export const resolvePublicSigningSession = createServerFn({ method: "GET" })
	.inputValidator((data: DocumentSigningTokenInput) =>
		documentSigningTokenSchema.parse(data),
	)
	.handler(
		async ({ data }): Promise<PublicSigningSessionResolveResponseDto> => {
			const response = await apiFetch<PublicSigningSessionResolveResponseDto>(
				`${documentSigningApiUrl}/public/sessions/resolve`,
				{
					method: "GET",
					params: { token: data.token },
				},
			);

			return publicSigningSessionResolveResponseSchema.parse(response);
		},
	);

export const getPublicSigningSession = createServerFn({ method: "GET" })
	.inputValidator((data: DocumentSigningTokenInput) =>
		documentSigningTokenSchema.parse(data),
	)
	.handler(async ({ data }): Promise<PublicSigningSessionResponseDto> => {
		const response = await apiFetch<PublicSigningSessionResponseDto>(
			`${documentSigningApiUrl}/public/sessions/me`,
			{
				method: "GET",
				accessToken: data.token,
			},
		);

		return publicSigningSessionResponseSchema.parse(response);
	});

export const acceptPublicSigningSession = createServerFn({ method: "POST" })
	.inputValidator(
		(data: { token: string; dto: AcceptPublicSigningSessionDto }) => ({
			token: documentSigningTokenSchema.parse({ token: data.token }).token,
			dto: acceptPublicSigningSessionSchema.parse(data.dto),
		}),
	)
	.handler(async ({ data }): Promise<AcceptPublicSigningSessionResponseDto> => {
		const response = await apiFetch<AcceptPublicSigningSessionResponseDto>(
			`${documentSigningApiUrl}/public/sessions/me/accept`,
			{
				method: "POST",
				accessToken: data.token,
				body: data.dto,
			},
		);

		return acceptPublicSigningSessionResponseSchema.parse(response);
	});

export function getPublicSigningUnsignedPdfUrl(token: string) {
	return `/api/document-signing/public/unsigned-pdf?token=${encodeURIComponent(token)}`;
}

function createPdfProxyProblem(status: number, fallbackMessage: string) {
	return new ProblemDetailsError({
		type: "about:blank",
		title: status === 0 ? "Network Error" : "Request Failed",
		status,
		detail: fallbackMessage,
	});
}

export async function fetchPublicSigningUnsignedPdfResponse(token: string) {
	const parsedToken = documentSigningTokenSchema.parse({ token });

	let response: Response;

	try {
		response = await fetch(
			`${process.env.BACKEND_URL}${documentSigningApiUrl}/public/sessions/me/unsigned-pdf`,
			{
				method: "GET",
				headers: {
					Authorization: `Bearer ${parsedToken.token}`,
				},
			},
		);
	} catch (error) {
		throw createPdfProxyProblem(
			0,
			error instanceof Error
				? error.message
				: "No pudimos cargar el PDF para firma.",
		);
	}

	if (!response.ok) {
		const raw = await response.json().catch(() => null);
		const detail =
			raw &&
			typeof raw === "object" &&
			"detail" in raw &&
			typeof raw.detail === "string"
				? raw.detail
				: raw &&
						typeof raw === "object" &&
						"message" in raw &&
						typeof raw.message === "string"
					? raw.message
					: "No pudimos cargar el PDF para firma.";

		throw createPdfProxyProblem(response.status, detail);
	}

	return response;
}

export async function fetchPublicSigningFinalCopyResponse(token: string) {
	const parsedToken = documentSigningTokenSchema.parse({ token });

	let response: Response;

	try {
		response = await fetch(
			`${process.env.BACKEND_URL}${documentSigningApiUrl}/public/final-copy/download?token=${encodeURIComponent(parsedToken.token)}`,
			{
				method: "GET",
			},
		);
	} catch (error) {
		throw createPdfProxyProblem(
			0,
			error instanceof Error
				? error.message
				: "No pudimos descargar la copia final firmada.",
		);
	}

	if (!response.ok) {
		const raw = await response.json().catch(() => null);
		const detail =
			raw &&
			typeof raw === "object" &&
			"detail" in raw &&
			typeof raw.detail === "string"
				? raw.detail
				: raw &&
						typeof raw === "object" &&
						"message" in raw &&
						typeof raw.message === "string"
					? raw.message
					: "No pudimos descargar la copia final firmada.";

		throw createPdfProxyProblem(response.status, detail);
	}

	return response;
}
