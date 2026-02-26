import { problemDetailsSchema } from "@repo/schemas";
import { useAppSession } from "./session";
import { ProblemDetailsError } from "@/shared/errors";

type ApiFetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  authenticated?: boolean;
};

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { body, headers, authenticated = true, ...rest } = options;

  const authHeader: Record<string, string> = {};

  if (authenticated) {
    const session = await useAppSession();
    const token = session.data.accessToken;

    if (!token) {
      throw new ProblemDetailsError({
        type: "about:blank",
        title: "Unauthorized",
        status: 401,
        detail: "No active session. Please log in.",
      });
    }

    authHeader["Authorization"] = `Bearer ${token}`;
  }

  let response: Response;

  try {
    response = await fetch(`${process.env.NESTJS_API_URL}${path}`, {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        ...authHeader,
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    // Network-level failure (no response at all)
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

    // If NestJS returned a valid ProblemDetails shape, use it.
    // Otherwise, build a fallback from the HTTP status.
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

  const successResponse = await response.json();
  return successResponse.data as T;
}
