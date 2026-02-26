import { problemDetailsSchema, type ProblemDetails } from "@repo/schemas";
import { useAppSession } from "./session";

export type ApiSuccess<T> = { success: true; data: T };
export type ApiError = { success: false; error: ProblemDetails };
export type ApiResult<T> = ApiSuccess<T> | ApiError;

function ok<T>(data: T): ApiSuccess<T> {
  return { success: true, data };
}

function fail(error: ProblemDetails): ApiError {
  return { success: false, error };
}

// Fallback for unexpected errors (network down, JSON parse failure, etc.)
// We normalize them into a ProblemDetails shape so the caller always
// deals with one error type.
function unexpectedError(error: unknown): ApiError {
  const detail =
    error instanceof Error ? error.message : "An unexpected error occurred";

  return fail({
    type: "about:blank",
    title: "Unexpected Error",
    status: 0,
    detail,
  });
}

// -----------------------------------------------------------------------
// Core fetch wrapper
// -----------------------------------------------------------------------

type ApiFetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  authenticated?: boolean;
};

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<ApiResult<T>> {
  const { body, headers, authenticated = true, ...rest } = options;

  try {
    const authHeader: Record<string, string> = {};

    if (authenticated) {
      const session = await useAppSession();
      const token = session.data.accessToken;

      if (!token) {
        return fail({
          type: "about:blank",
          title: "Unauthorized",
          status: 401,
          detail: "No active session. Please log in.",
        });
      }

      authHeader["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${process.env.NESTJS_API_URL}${path}`, {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        ...authHeader,
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const raw = await response.json().catch(() => null);
      const parsed = problemDetailsSchema.safeParse(raw);

      // If NestJS returned a valid ProblemDetails shape, use it.
      // Otherwise, build a fallback from the HTTP status.
      if (parsed.success) {
        return fail(parsed.data);
      }

      return fail({
        type: "about:blank",
        title: response.statusText || "Request Failed",
        status: response.status,
        detail: `Request to ${path} failed with status ${response.status}`,
      });
    }

    const successResponse = await response.json();
    const data = successResponse.data as T;
    return ok(data);
  } catch (error) {
    return unexpectedError(error);
  }
}
