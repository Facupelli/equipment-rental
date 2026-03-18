import type { ResolvedTenantContext } from "@repo/schemas";
import { createServerFn } from "@tanstack/react-start";
import { getRequestUrl } from "@tanstack/react-start/server";

function getHostname(): string {
  const url = new URL(getRequestUrl());
  return url.hostname; // strips port automatically — handles localhost:3000 in dev
}

function buildCacheKey(hostname: string, rootDomain: string): string {
  // Use the real Worker hostname per Cloudflare's recommendation —
  // avoid fake hostnames like https://cache/... to prevent DNS lookup issues
  return `https://${rootDomain}/cache/tenant-context/${hostname}`;
}

async function readFromCache(
  cacheKey: string,
): Promise<ResolvedTenantContext | null> {
  // Cache API is only available in the Cloudflare Worker runtime,
  // not in Vinxi's local dev server
  if (typeof caches === "undefined") {
    return null;
  }

  const cache = await caches.open("tenant-context");
  const cached = await cache.match(cacheKey);

  if (!cached) {
    return null;
  } // cache.match() returns undefined on miss, never throws

  return cached.json() as Promise<ResolvedTenantContext>;
}

async function writeToCache(
  cacheKey: string,
  context: ResolvedTenantContext,
): Promise<void> {
  if (typeof caches === "undefined") return;

  const cache = await caches.open("tenant-context");

  // stale-while-revalidate and stale-if-error are NOT supported by the
  // Workers Cache API put/match methods — only max-age is used here
  await cache.put(
    cacheKey,
    Response.json(context, {
      headers: { "Cache-Control": "max-age=60" },
    }),
  );
}

export const resolveTenantContext = createServerFn({ method: "GET" }).handler(
  async (): Promise<ResolvedTenantContext> => {
    const nestApiUrl = process.env.BACKEND_URL as string | undefined;
    const internalToken = process.env.INTERNAL_API_TOKEN as string | undefined;
    const rootDomain = process.env.ROOT_DOMAIN as string | undefined;

    if (!nestApiUrl) {
      throw new Error("NEST_API_URL is not set");
    }
    if (!internalToken) {
      throw new Error("INTERNAL_API_TOKEN is not set");
    }
    if (!rootDomain) {
      throw new Error("ROOT_DOMAIN is not set");
    }

    const hostname = getHostname();
    const cacheKey = buildCacheKey(hostname, rootDomain);

    const cached = await readFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(
        `${nestApiUrl}/internal/tenant-context?hostname=${encodeURIComponent(hostname)}`,
        {
          headers: {
            "x-internal-token": internalToken,
          },
        },
      );

      if (response.status === 404) {
        // Let __root.tsx notFoundComponent handle this cleanly
        throw { isNotFound: true };
      }

      if (!response.ok) {
        throw new Error(
          `Tenant context resolution failed: ${response.status} ${response.statusText}`,
        );
      }

      const context = (await response.json()).data as ResolvedTenantContext;

      await writeToCache(cacheKey, context);

      return context;
    } catch (error) {
      console.log("TENANT CONTEXT RESOLUTION ERROR:", { error });
      throw error;
    }
  },
);
