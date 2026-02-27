import { problemDetailsSchema, type PaginatedDto } from "@repo/schemas";
import { useAppSession } from "./session";
import { ProblemDetailsError } from "@/shared/errors";

type ApiFetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  params?: Record<string, unknown>;
  authenticated?: boolean;
};

async function apiFetchRaw<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { body, headers, params, authenticated = true, ...rest } = options;

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

  const url = new URL(`${process.env.NESTJS_API_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  try {
    response = await fetch(url, {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        ...authHeader,
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

  return response.json() as Promise<T>;
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const body = await apiFetchRaw<{ data: T }>(path, options);
  return body.data;
}

export async function apiFetchPaginated<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<PaginatedDto<T>> {
  const body = await apiFetchRaw<PaginatedDto<T>>(path, options);
  return body;
}
