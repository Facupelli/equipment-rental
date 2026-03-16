import { problemDetailsSchema, type PaginatedDto } from "@repo/schemas";
import { ProblemDetailsError } from "@/shared/errors";
import { getAppSession } from "./session";
import { refreshSession } from "@/features/auth/refresh-session";

type ApiFetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  params?: Record<string, unknown>;
  authenticated?: boolean;
  /** Pass 'admin' or 'portal' so refreshSession redirects to the right login page on failure. */
  face?: "admin" | "portal";
};

// ── apiFetchRaw ───────────────────────────────────────────────────────────────
// Core fetch wrapper. Proactive token refresh is handled upstream by
// ensureValidSession() in the _admin/dashboard layout beforeLoad — by the time any
// server function calls apiFetch, the session is already guaranteed fresh.
//
// This function retains a reactive 401 fallback as a safety net for edge cases:
// revoked tokens, clock skew, or any request that somehow bypasses beforeLoad.
//
// The loop runs at most twice:
//   Attempt 1: use current token from session
//   On 401:    call refreshSession() once → attempt 2 with fresh token
//   Attempt 2: if 401 again, surface the error — something is genuinely wrong

async function apiFetchRaw<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const {
    body,
    headers,
    params,
    authenticated = true,
    face = "admin",
    ...rest
  } = options;

  const url = new URL(`${process.env.NESTJS_API_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  let currentToken: string | undefined;
  let hasRetried = false;

  while (true) {
    const authHeader: Record<string, string> = {};

    if (authenticated) {
      if (!currentToken) {
        const session = await getAppSession();
        currentToken = session.data.accessToken;
      }

      if (!currentToken) {
        throw new ProblemDetailsError({
          type: "about:blank",
          title: "Unauthorized",
          status: 401,
          detail: "No active session. Please log in.",
        });
      }

      authHeader["Authorization"] = `Bearer ${currentToken}`;
    }

    let response: Response;

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

    // ── Reactive 401 Fallback ─────────────────────────────────────────────────
    if (response.status === 401 && authenticated && !hasRetried) {
      const refreshed = await refreshSession(face);

      if (refreshed) {
        currentToken = undefined; // force re-read from session on next iteration
        hasRetried = true;
        continue;
      }
      // refreshSession() returned false (network failure) — fall through to error
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

    // ── FIX: handle 204 No Content (e.g. POST /auth/logout) ──────────────────
    // response.json() throws on an empty body — guard against it.
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

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
