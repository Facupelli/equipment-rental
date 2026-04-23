# Authentication Architecture

## Context

This is a multi-tenant equipment rental SaaS. Two distinct actor types exist in the system:

Related docs:

- `tenant-context-resolution.md` for how the system resolves admin versus portal requests before authentication
- `rental-orders-and-fulfillment.md` for order flows that depend on customer versus admin actors
- `rental-domain-model.md` for the overall rental-domain overview

- **User** — tenant back-office staff (admins, collaborators). Invited by the tenant owner, managed with roles and permissions.
- **Customer** — end-users who register on the booking portal to make rental orders. Self-registered, no roles.

Both actors authenticate against the same NestJS application but represent fundamentally different identities with different trust levels, lifecycles, and access scopes.

---

## Decision 1: Two Identity Tables, Not One

### Options Considered

**Single table** with a `type` discriminator column. One auth pipeline, shared email uniqueness.

**Two separate tables** — `User` and `Customer` — each with its own fields, relations, and lifecycle.

### Decision: Two Separate Tables

Users and Customers have diverging domain concerns that will keep growing:

- `Customer` has a profile, onboarding flow, orders, and company info — none of which belongs near admin accounts.
- `User` has roles, permissions, and invitation flows — none of which applies to customers.
- They authenticate against different contexts: a Customer logs into the booking portal, a User logs into the back-office. Even if the same real person holds both, these are different sessions with different scopes.
- Security boundary is explicit — a Customer JWT cannot accidentally grant back-office access.

A single "God Table" would produce many nullable columns and conditional logic everywhere. The separation correctly models a real domain boundary.

---

## Decision 2: Unified Refresh Token Table

### Options Considered

**Two separate token tables** — `UserRefreshToken` and `CustomerRefreshToken`. Natural scoping, zero shared infrastructure.

**One unified table** — `RefreshToken` with `actorType` and `actorId` columns.

### Decision: Unified Table

In this domain, a back-office User and a booking Customer are different people with no meaningful overlap. The cross-actor contamination risk of a unified table is near-zero. The benefits are:

- Token rotation, revocation, expiry cleanup, and reuse detection all live in one `TokenRepository` class.
- A future actor type (e.g. `Partner`, `Supplier`) requires only a new enum value — not a new table, strategy variant, and cleanup job.
- System-wide session analytics and monitoring require one query instead of a UNION.

### Safety Mechanism

The unified table has no Prisma relations to `User` or `Customer` — it is a polymorphic association the ORM cannot enforce declaratively. To compensate, `actorType` is a **non-optional parameter on every `TokenRepository` method signature**. Forgetting it is a compile error, not a runtime bug.

```
find(jti, actorType)
revokeOne(jti)
revokeAll(actorId, actorType)
store(actorId, actorType, tokenId, rawToken, expiresAt)
rotateToken(oldTokenId, actorId, actorType, newTokenId, rawToken, expiresAt)
```

### Cascade Delete Trade-off

With separate tables, deleting an actor cascades to their tokens via a DB foreign key. With the unified table, there is no FK — orphan token cleanup must be explicit in application logic. This is acceptable because both `User` and `Customer` use soft deletes (`deletedAt`), so hard deletes are rare and always intentional.

---

## Decision 3: actorType in the JWT Payload

### Problem

A Customer token and a User token are structurally identical JWTs. A single `JwtStrategy` has no way to know which DB table to look up unless the token carries that information.

### Decision: Embed actorType in All Tokens

Both access tokens and refresh tokens carry `actorType: 'USER' | 'CUSTOMER'`.

**Access token payload:**

```json
{ "sub": "uuid", "email": "...", "tenantId": "uuid", "actorType": "USER" }
```

**Refresh token payload:**

```json
{ "id": "uuid", "email": "...", "tenantId": "uuid", "actorType": "USER", "jti": "token-row-id" }
```

`JwtStrategy` validates the token and stamps `req.user` with `actorType`. Every downstream guard and handler knows exactly what kind of actor is making the request.

---

## Decision 4: Two Local Strategies, Shared JWT Strategies

### Local Strategies (Login only)

| Strategy                | Name             | Validates                            |
| ----------------------- | ---------------- | ------------------------------------ |
| `LocalStrategy`         | `local`          | User email + password                |
| `LocalCustomerStrategy` | `local-customer` | Customer email + password + tenantId |

Each queries its own table. Everything downstream is identical.

**Why tenantId for Customer login?**

The `Customer` model uses a composite unique constraint `@@unique([tenantId, email])`. The same email can exist as separate accounts across different tenants. Without `tenantId`, the login query is ambiguous. The tenant is resolved from the URL (e.g. `tenant-a.yourapp.com`) by the frontend and sent transparently — the customer never types it manually.

### JWT Strategies (Every protected request)

| Strategy               | Name          | Validates                      |
| ---------------------- | ------------- | ------------------------------ |
| `JwtStrategy`          | `jwt`         | Access token — actor-agnostic  |
| `RefreshTokenStrategy` | `jwt-refresh` | Refresh token — actor-agnostic |

Both strategies are shared across all actor types. `actorType` in the payload provides all the context needed.

---

## Decision 5: Authentication vs Authorization Separation

### Problem

`JwtAuthGuard` answers: _is this a valid token?_ It does not answer: _is this actor allowed on this route?_

### Decision: Dedicated Actor Guards

Two thin guards enforce the security boundary at the route level:

- `UserOnlyGuard` — asserts `req.user.actorType === 'USER'`, throws `ForbiddenException` otherwise.
- `CustomerOnlyGuard` — asserts `req.user.actorType === 'CUSTOMER'`, throws `ForbiddenException` otherwise.

Route usage:

```ts
// Back-office routes
@UseGuards(JwtAuthGuard, UserOnlyGuard)

// Customer-facing routes
@UseGuards(JwtAuthGuard, CustomerOnlyGuard)
```

`ForbiddenException` (403) is used — not `UnauthorizedException` (401). The distinction matters: 401 means "I don't know who you are." 403 means "I know who you are, but you cannot be here." A Customer hitting a back-office route is the latter.

---

## Auth Flow Diagrams

### Login

```
POST /auth/login
  → LocalAuthGuard         triggers LocalStrategy
  → LocalStrategy          validates User email+password
  → AuthController         stamps actorType: USER
  → AuthService.login      signs access + refresh tokens
  → TokenRepository.store  persists hashed refresh token
  ← { access_token, refresh_token }

POST /auth/customer/login
  → LocalCustomerAuthGuard     triggers LocalCustomerStrategy
  → LocalCustomerStrategy      validates Customer email+password+tenantId
                               stamps actorType: CUSTOMER on req.user
  → AuthService.login          signs access + refresh tokens
  → TokenRepository.store      persists hashed refresh token
  ← { access_token, refresh_token }
```

### Protected Request

```
GET /some-back-office-route
  Authorization: Bearer <access_token>

  → JwtAuthGuard      triggers JwtStrategy
  → JwtStrategy       decodes token → req.user = { id, email, tenantId, actorType }
  → UserOnlyGuard     checks req.user.actorType === USER → passes or throws 403
  → Route handler     runs
```

### Token Refresh

```
POST /auth/refresh
  Authorization: Bearer <refresh_token>

  → RefreshTokenGuard       triggers RefreshTokenStrategy
  → RefreshTokenStrategy    decodes token
                            TokenRepository.find(jti, actorType)
                            checks revokedAt  → reuse detection → revokeAll if triggered
                            checks expiresAt  → revokeOne if expired
                            returns { actorId, actorType, tokenId }
  → AuthService.refreshTokens
                            resolveActor(actorId, actorType) → fetches fresh claims
                            signs new access + refresh tokens
                            TokenRepository.rotateToken → atomic revoke old + insert new
  ← { access_token, refresh_token }
```

### Logout

```
POST /auth/logout
  Authorization: Bearer <access_token>

  → JwtAuthGuard      validates token → req.user = { id, actorType, ... }
  → AuthService.logout
  → TokenRepository.revokeAll(actorId, actorType)  revokes all active sessions
```

---

## Security Properties

**Refresh token reuse detection** — if a revoked refresh token is presented again, a theft scenario is assumed. All sessions for that actor are immediately invalidated and a full re-login is required.

**Server-side expiry** — token expiry is enforced in the DB, not just in the JWT. This allows force-expiring tokens before their JWT expiry (forced logout, security incident response).

**Atomic token rotation** — the old refresh token is revoked and the new one is created in a single Prisma transaction. If the insert fails, the revoke rolls back — the client can safely retry with the old token.

**Tenant-scoped customer lookup** — customer credential queries always include `tenantId`. A Customer token from tenant A cannot be used to authenticate against tenant B.

---

## File Map

```
src/modules/auth/
  application/
    auth.service.ts                         actor-agnostic token issuing and rotation
    bcrypt.service.ts                       credential validation for User and Customer
  infrastructure/
    repositories/
      token.repository.ts                   all refresh token DB operations
    strategies/
      local.strategy.ts                     validates User email+password
      local-customer.strategy.ts            validates Customer email+password+tenantId
      jwt.strategy.ts                       validates access token, stamps req.user
      jwt-refresh.strategy.ts               validates refresh token, handles reuse detection
    guards/
      local-auth.guard.ts                   triggers local strategy
      local-customer-auth.guard.ts          triggers local-customer strategy
      jwt-auth.guard.ts                     triggers jwt strategy (global)
      jwt-refresh.guard.ts                  triggers jwt-refresh strategy
      user-only.guard.ts                    asserts actorType === USER
      customer-only.guard.ts                asserts actorType === CUSTOMER
    controllers/
      auth.controller.ts                    login, refresh, logout endpoints
  auth.module.ts

src/modules/customers/
  application/
    queries/
      find-credentials-by-email/
        find-customer-credentials-by-email.query.ts
        find-customer-credentials-by-email.query-handler.ts
```
