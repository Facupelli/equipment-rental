# Frontend Architecture — TanStack Start

## Philosophy

This project uses **vertical slices** (feature-based) architecture. Each feature owns its code end-to-end, rather than spreading it across technical layers like `hooks/`, `components/`, `utils/`.

**each feature exposes a deliberate public API and hides its internals**.

---

## Folder Structure

```
src/
│── routes/                 # File-based routing
│     ├── __root.tsx
│     ├── _auth/
│     │   ├── login.tsx
│     │   └── register.tsx
│     └── (protected)/
│           └── dashboard.tsx
│
├── features/                   # Vertical slices — one per domain
│   └── auth/
│       ├── api/                # HTTP calls / server functions (adapter layer)
│       ├── components/         # UI components scoped to this feature
│       ├── hooks/              # Feature-local hooks
│       └── types/              # DTOs and domain types
│
└── shared/                     # Truly cross-cutting code, no domain ownership
    ├── components/             # Design system primitives (Button, Modal, Input...)
    ├── hooks/                  # Generic hooks (useDebounce, useMediaQuery...)
    └── lib/                    # Axios instance, query client config, utils...
```

---

## Core Principles

### 1. Feature = Bounded Context

Each folder in `features/` maps to a domain in the NestJS backend (e.g., `auth`, `orders`, `users`). All code related to that domain lives there — API calls, components, hooks, and types — together.

**Do not create a feature folder preemptively.** Only create it when the domain actually exists.

### 2. The `api/` Layer is the Adapter

The `features/auth/api/` folder is the only place that knows about HTTP calls for that domain. Nothing outside this folder makes raw requests related to auth.

### 3. Features Don't Import From Each Other Directly

If feature A needs something from feature B, one of two things is true:

- That thing actually belongs in `shared/`
- You need to reconsider your bounded context boundaries

### 4. `shared/` Has No Domain Knowledge

`shared/` contains only domain-agnostic code. A `Button` component belongs in `shared/`. An `AddToCartButton` belongs in `features/cart/`.

---

## Adding a New Domain

When a new backend domain is introduced (e.g., `orders`):

1. Create `src/features/orders/`
2. Add subfolders as needed: `api/`, `components/`, `hooks/`, `types/`
3. Add corresponding routes under `src/app/routes/`

---

## Aggregator Pages

Some pages may aggregate multiple domains (e.g., a dashboard showing orders + users + analytics). These get their own feature slice:

```
features/
└── dashboard/
    ├── components/
    │   └── DashboardPage.tsx   # Composes from other features via their index.ts
    └── index.ts
```

The dashboard feature imports from other features only through their public `index.ts` — never reaching into their internals.

---

## What Goes Where — Quick Reference

| Code                                  | Location                        |
| ------------------------------------- | ------------------------------- |
| API call for a specific domain        | `features/<domain>/api/`        |
| UI component owned by a domain        | `features/<domain>/components/` |
| Hook owned by a domain                | `features/<domain>/hooks/`      |
| Reusable UI primitive (Button, Modal) | `shared/components/`            |
| Generic utility hook (useDebounce)    | `shared/hooks/`                 |
| HTTP client config, query client      | `shared/lib/`                   |
| Route file                            | `app/routes/`                   |

---
