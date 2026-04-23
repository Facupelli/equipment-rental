# Multi-Tenant Architecture

## Overview

This is a multi-tenant equipment rental SaaS. Each tenant is an independent business (a rental company) that uses the platform to manage their equipment and serve their own customers.

Related docs:

- `rental-domain-model.md` for the overview of rental concepts that tenant context enables
- `rental-locations-and-availability.md` for location context inside the rental domain after tenant resolution succeeds
- `user-customer-auth.md` for actor-boundary enforcement after face and tenant resolution

The system exposes two distinct faces:

- **Portal** — the customer-facing booking interface, accessed by the tenant's end-users
- **Admin** — the back-office interface, accessed by the tenant's staff

Both faces are served from a single TanStack Start application deployed to Cloudflare Workers, backed by a single NestJS API deployed to Railway.

---

## Domain Structure

### URL Scheme

| URL                    | Face   | Tenant Resolution                       |
| ---------------------- | ------ | --------------------------------------- |
| `slug.mydomain.com`    | Portal | Extracted from subdomain                |
| `www.their-domain.com` | Portal | Looked up by active custom domain in DB |
| `app.mydomain.com`     | Admin  | Fixed — no tenant in URL                |

The admin face lives at `app.mydomain.com` rather than `admin.slug.mydomain.com` for two reasons. First, Cloudflare's wildcard SSL certificate only covers one level deep (`*.mydomain.com`) — a two-level subdomain would require an Advanced Certificate. Second, tenants' staff are logging into the platform's infrastructure, not their own brand — `app.mydomain.com` is correct semantically.

### Custom Domains

Tenants can bring their own custom subdomain (for example `www.customer.com`). Phase 1 supports subdomains only — apex domains like `customer.com` are rejected.

Provisioning is backed by Cloudflare Custom Hostnames (SSL for SaaS). The backend now stores lifecycle state in a dedicated `CustomDomain` table, while `Tenant.customDomain` remains the live routing field used at request time.

This split is intentional:

- `CustomDomain` stores provisioning metadata such as provider id, status, verification time, and the latest provider error.
- `Tenant.customDomain` is only populated after a manual refresh confirms the hostname is active.

There is no webhook or cron-based activation in this phase. Staff manually trigger a refresh endpoint, and only that activation path promotes the hostname into `Tenant.customDomain`.

### Local Development

In local dev there is no subdomain structure — the browser cannot resolve `guanaco.localhost` without hosts file tricks. The NestJS resolver supports a `DEV_TENANT_SLUG` env var that activates when the hostname matches `ROOT_DOMAIN` exactly, returning the specified tenant as a portal context. This path is never reachable in production since production hostnames always have subdomain structure or are registered custom domains.

---

## Tenant Context Resolution

### The Problem

Every SSR request needs to know two things before rendering: which face is being served, and which tenant owns this URL. This information must be available before any route renders — it affects routing, guards, and branding.

### The Resolver Endpoint

A dedicated NestJS endpoint handles resolution:

```
GET /internal/tenant-context?hostname=slug.mydomain.com
```

It is **not** part of the public API. It is protected by a shared secret (`x-internal-token` header) and marked public from the JWT auth guard — it is pre-authentication by design.

The resolution logic runs in this order:

```
1. hostname === "app.{ROOT_DOMAIN}"
     → { face: 'admin' }

2. hostname ends with ".{ROOT_DOMAIN}"
     → extract slug
     → if slug in BANNED_TENANT_SLUGS → 404
     → look up tenant by slug
     → if not found or soft-deleted → 404
     → { face: 'portal', tenant }

3. anything else (custom domain)
     → look up tenant by Tenant.customDomain field
     → if not found or soft-deleted → 404
     → { face: 'portal', tenant }

[Local dev only]
0. hostname === ROOT_DOMAIN exactly
     → look up tenant by DEV_TENANT_SLUG env var
     → { face: 'portal', tenant }
```

Order matters. Path 1 is checked before path 2, so `app.mydomain.com` can never be accidentally resolved as a tenant slug named "app". Banned slugs are checked before the DB query on path 2.

### Banned Slugs

The following slugs cannot be registered as tenant identifiers because they are reserved for platform infrastructure:

```
app, www, api, admin, internal, mail, static
```

This list lives in `src/modules/tenant/domain/tenant.constants.ts` — a single source of truth imported by both the resolver and the tenant creation handler to prevent drift.

### Active Routing Invariant

Unknown hostnames are resolved only through `Tenant.customDomain`. A `CustomDomain` row in `PENDING`, `ACTION_REQUIRED`, or `FAILED` does not affect runtime routing until a refresh marks it active and copies the domain into `Tenant.customDomain`.

### Soft Deletes

Both slug and custom domain lookups filter `deletedAt: null`. A soft-deleted tenant resolves identically to a non-existent one — the portal returns 404. This prevents deleted tenants' portals from remaining accessible.

### Implementation — Two Query Handlers

The resolver uses two query handlers following the architecture's CQRS pattern:

- `FindTenantBySlugQueryHandler` — queries Prisma directly, returns `TenantContext | null`
- `FindTenantByCustomDomainQueryHandler` — queries Prisma directly, returns `TenantContext | null`

Queries bypass the domain model entirely (no aggregates, no repositories) and return flat DTOs. The `InternalController` dispatches via `QueryBus` — no direct module imports.

---

## TanStack Start Integration

### Router Context

Tenant context is resolved once per SSR request in `__root.tsx`'s `beforeLoad` and injected into TanStack Router's typed context. Every route in the entire tree has access to `context.tenantContext` without re-fetching.

```typescript
type RouterContext = {
  queryClient: QueryClient; // from TanStack Query integration
  tenantContext: ResolvedTenantContext; // from tenant resolver
};
```

The `ResolvedTenantContext` type is a discriminated union:

```typescript
type ResolvedTenantContext = { face: 'admin' } | { face: 'portal'; tenant: TenantContext };
```

The discriminant does real work — TypeScript will not allow accessing `.tenant` on an admin context without first narrowing `face === 'portal'`. This makes cross-face data access a compile error, not a runtime bug.

### Face Boundary Enforcement

Two layout routes enforce the face boundary at the route level — the frontend equivalent of the backend's `UserOnlyGuard` and `CustomerOnlyGuard`:

- `_portal/__layout.tsx` — redirects to `/admin/login` if `face !== 'portal'`
- `admin/__layout.tsx` — redirects to `/login` if `face !== 'admin'`

These run in `beforeLoad`, before any child route renders. A customer token cannot accidentally access admin routes, and an admin session cannot render the portal — enforced at the routing layer independently of the JWT layer.

### Route Tree Structure

```
routes/
  __root.tsx                  ← tenant context resolution (beforeLoad)
  _portal/
    __layout.tsx              ← face === portal guard
    login.tsx                 ← public portal login
    register.tsx              ← public portal register
    _authenticated/
      __layout.tsx            ← JWT guard (customer)
      index.tsx
      booking.tsx
  admin/
    __layout.tsx              ← face === admin guard
    login.tsx                 ← public admin login
    _authenticated/
      __layout.tsx            ← JWT guard (user)
      dashboard.tsx
      equipment.tsx
```

`admin/login` and `_portal/login` both resolve to `/login` on their respective domains. The hostname already provides disambiguation — path redundancy is intentional for full separation and zero ambiguity.

### Edge Caching

The resolver response is cached at the Cloudflare edge using the Workers Cache API:

```
Cache key: https://{ROOT_DOMAIN}/cache/tenant-context/{hostname}
TTL: 60 seconds (Cache-Control: max-age=60)
Named cache: caches.open('tenant-context')
```

Cache is **per data center** — the first request to any given Cloudflare edge location misses the cache and calls NestJS on Railway. Subsequent requests from the same data center hit the cache. This is acceptable: cache warms quickly under real traffic.

`stale-while-revalidate` and `stale-if-error` are not used — the Workers Cache API does not support them on `put`/`match` operations.

The Cache API is only available in the Cloudflare Worker runtime, not in Vinxi's local dev server. The server function guards with `typeof caches !== 'undefined'` and falls through to a direct NestJS call silently in local dev.

---

## Shared Types

The contract between NestJS and TanStack Start is defined once in the shared package:

```typescript
// @your-org/shared

export type TenantContext = {
  id: string;
  slug: string;
  name: string;
  customDomain: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
};

export type ResolvedTenantContext = { face: 'admin' } | { face: 'portal'; tenant: TenantContext };
```

NestJS returns this shape. TanStack Start consumes it. Neither side duplicates the definition.

---

## Tenant Model

```prisma
model Tenant {
  id           String    @id @default(uuid())
  name         String
  slug         String    @unique
  customDomain String?   @unique @map("custom_domain")
  logoUrl      String?   @map("logo_url")
  primaryColor String?   @map("primary_color")
  deletedAt    DateTime? @map("deleted_at")
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")
  config       Json
  // ... relations
}
```

`customDomain` is `@unique` — two tenants cannot claim the same domain. The DB enforces this, not just application logic. `logoUrl` and `primaryColor` are explicit columns rather than inside `config` because they are queried on every portal request — they are first-class branding concerns.

---

## Environment Variables

### NestJS (Railway)

| Variable             | Description                                              |
| -------------------- | -------------------------------------------------------- |
| `ROOT_DOMAIN`        | e.g. `mydomain.com`                                      |
| `INTERNAL_API_TOKEN` | Shared secret for internal endpoints                     |
| `DEV_TENANT_SLUG`    | Local dev only — tenant slug to use for bare `localhost` |

### TanStack Start (Cloudflare)

| Variable             | Description                         |
| -------------------- | ----------------------------------- |
| `ROOT_DOMAIN`        | e.g. `mydomain.com`                 |
| `INTERNAL_API_TOKEN` | Must match NestJS value exactly     |
| `NEST_API_URL`       | e.g. `https://your-api.railway.app` |

Both sides assert their required env vars at startup — missing values throw loudly rather than producing silent wrong behavior.

---

## Security Properties

**Internal endpoint is pre-auth by design.** `/internal/tenant-context` is marked public from the JWT guard — it runs before any session exists. It is protected exclusively by the `x-internal-token` shared secret. Only the Cloudflare Worker should ever call it.

**Banned slug list prevents subdomain hijacking.** Reserved platform subdomains (`app`, `www`, `api`, etc.) are blocked at both resolution time and tenant creation time via a shared constants file.

**Soft-deleted tenants are invisible.** Deleted tenants return 404 identically to non-existent ones — their portals become inaccessible immediately on deletion.

**Face boundary is enforced at two independent layers.** The JWT (`actorType` in token payload + `UserOnlyGuard`/`CustomerOnlyGuard` on the backend) and the route layout guards on the frontend both enforce the boundary independently. A customer JWT cannot reach admin routes even if the frontend guard were bypassed.

**TypeScript enforces cross-face data access at compile time.** The `ResolvedTenantContext` discriminated union makes accessing `.tenant` on an admin context a type error, not a runtime null reference.
