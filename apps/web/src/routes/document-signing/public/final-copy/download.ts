import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { fetchPublicSigningFinalCopyResponse } from "@/features/document-signing/document-signing.api";
import { ProblemDetailsError } from "@/shared/errors";

const searchSchema = z.object({
	token: z.string().trim().min(1),
});

function jsonError(message: string, status: number) {
	return Response.json({ message }, { status });
}

export const Route = createFileRoute(
	"/document-signing/public/final-copy/download",
)({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const url = new URL(request.url);
				const parsedSearch = searchSchema.safeParse({
					token: url.searchParams.get("token") ?? "",
				});

				if (!parsedSearch.success) {
					return jsonError("Token de descarga invalido.", 400);
				}

				try {
					const response = await fetchPublicSigningFinalCopyResponse(
						parsedSearch.data.token,
					);
					const headers = new Headers();
					const contentType = response.headers.get("Content-Type");
					const contentDisposition = response.headers.get("Content-Disposition");
					const contentLength = response.headers.get("Content-Length");

					if (contentType) {
						headers.set("Content-Type", contentType);
					}

					if (contentDisposition) {
						headers.set("Content-Disposition", contentDisposition);
					}

					if (contentLength) {
						headers.set("Content-Length", contentLength);
					}

					headers.set("Cache-Control", "private, no-store");
					headers.set("X-Content-Type-Options", "nosniff");

					return new Response(response.body, {
						status: response.status,
						headers,
					});
				} catch (error) {
					if (error instanceof ProblemDetailsError) {
						return jsonError(
							error.problemDetails.detail || error.problemDetails.title,
							error.problemDetails.status,
						);
					}

					return jsonError("No pudimos descargar la copia final firmada.", 500);
				}
			},
		},
	},
});
