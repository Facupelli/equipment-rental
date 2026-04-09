import { problemDetailsSchema } from "@repo/schemas";
import { ProblemDetailsError } from "@/shared/errors";

export type ApiRequestOptions = Omit<RequestInit, "body"> & {
	body?: unknown;
	params?: Record<string, unknown>;
};

export async function apiFetchRaw<T>(
	path: string,
	options: ApiRequestOptions = {},
): Promise<T> {
	const { body, headers, params, ...rest } = options;

	const url = new URL(`${process.env.BACKEND_URL}${path}`);
	if (params) {
		Object.entries(params).forEach(([key, value]) => {
			if (value !== undefined && value !== null) {
				url.searchParams.set(key, String(value));
			}
		});
	}

	let response: Response;

	try {
		response = await fetch(url, {
			...rest,
			headers: {
				"Content-Type": "application/json",
				...headers,
			},
			body: body !== undefined ? JSON.stringify(body) : undefined,
		});
	} catch (error) {
		throw new ProblemDetailsError({
			type: "about:blank",
			title: "Network Error",
			status: 0,
			detail:
				error instanceof Error
					? error.message
					: "An unexpected network error occurred",
		});
	}

	if (!response.ok) {
		const raw = await response.json().catch(() => null);
		const parsed = problemDetailsSchema.safeParse(raw);

		throw new ProblemDetailsError(
			parsed.success
				? parsed.data
				: {
						type: "about:blank",
						title: response.statusText || "Request Failed",
						status: response.status,
						detail: `Request to ${path} failed with status ${response.status}`,
					},
		);
	}

	if (response.status === 204) {
		return undefined as T;
	}

	return response.json() as Promise<T>;
}
