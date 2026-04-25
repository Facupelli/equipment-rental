import {
	type GenerateOrderBudgetRequestDto,
	generateOrderBudgetRequestSchema,
} from "@repo/schemas";
import { ActorType } from "@repo/types";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { requireSession } from "@/features/auth/auth-guards.server";
import {
	AuthRequiredError,
	ProblemDetailsError,
	SessionExpiredError,
	WrongActorError,
} from "@/shared/errors";

const orderParamsSchema = z.object({
	orderId: z.uuid(),
});

function jsonError(message: string, status: number) {
	return Response.json({ message }, { status });
}

export const Route = createFileRoute("/api/orders/$orderId/budget/download")({
	server: {
		handlers: {
			POST: async ({ params, request }) => {
				const parsedParams = orderParamsSchema.safeParse(params);

				if (!parsedParams.success) {
					return jsonError("Pedido invalido.", 400);
				}

				const body = await parseBudgetRequestBody(request);

				if (!body) {
					return jsonError("Solicitud invalida.", 400);
				}

				try {
					const session = await requireSession({ actorType: ActorType.USER });
					const response = await fetch(
						`${process.env.BACKEND_URL}/orders/${parsedParams.data.orderId}/presupuesto/download`,
						{
							method: "POST",
							headers: {
								Authorization: `Bearer ${session.accessToken}`,
								"Content-Type": "application/json",
							},
							body: JSON.stringify(body),
						},
					);

					if (response.ok) {
						const headers = new Headers();
						const contentType = response.headers.get("Content-Type");
						const contentDisposition = response.headers.get(
							"Content-Disposition",
						);

						if (contentType) {
							headers.set("Content-Type", contentType);
						}

						if (contentDisposition) {
							headers.set("Content-Disposition", contentDisposition);
						}

						headers.set("Cache-Control", "private, no-store");
						headers.set("X-Content-Type-Options", "nosniff");

						return new Response(response.body, {
							status: response.status,
							headers,
						});
					}

					if (response.status === 404) {
						return jsonError("Pedido no encontrado.", 404);
					}

					const raw = await response.json().catch(() => null);
					const problem = raw && typeof raw === "object" ? raw : null;

					if (response.status === 422) {
						return jsonError(
							typeof problem?.detail === "string"
								? problem.detail
								: "No pudimos generar el presupuesto en este momento.",
							422,
						);
					}

					return jsonError(
						typeof problem?.detail === "string"
							? problem.detail
							: "No pudimos generar el presupuesto en este momento.",
						response.status || 500,
					);
				} catch (error) {
					if (
						error instanceof AuthRequiredError ||
						error instanceof SessionExpiredError
					) {
						return jsonError("No autorizado.", 401);
					}

					if (error instanceof WrongActorError) {
						return jsonError("Prohibido.", 403);
					}

					if (error instanceof ProblemDetailsError) {
						return jsonError(
							error.problemDetails.detail || error.problemDetails.title,
							error.problemDetails.status,
						);
					}

					return jsonError(
						"No pudimos generar el presupuesto en este momento.",
						500,
					);
				}
			},
		},
	},
});

async function parseBudgetRequestBody(
	request: Request,
): Promise<GenerateOrderBudgetRequestDto | null> {
	const rawBody = await request.text();
	const parsedJson = rawBody ? safeJsonParse(rawBody) : {};

	if (parsedJson === null) {
		return null;
	}

	const parsedBody = generateOrderBudgetRequestSchema.safeParse(parsedJson);
	return parsedBody.success ? parsedBody.data : null;
}

function safeJsonParse(value: string): unknown | null {
	try {
		return JSON.parse(value);
	} catch {
		return null;
	}
}
