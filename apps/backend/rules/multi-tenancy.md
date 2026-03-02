# Multi-Tenancy & Security Rules

> **This file is always-on. Load it before every task without exception.**

## Strategy

Every tenant-scoped table has a `tenantId` column. A `Prisma.$extend` middleware
automatically injects `tenantId` from the JWT token for all standard Prisma operations.

## CRITICAL: Raw SQL Does Not Have Automatic Injection

Prisma does not support `tstzrange` natively. Any booking range query requires raw SQL
via `$queryRaw` or `$executeRaw`. **The automatic `tenantId` injection does NOT apply
to raw SQL.** You are responsible for injecting it manually every time.

### Rule

Every raw SQL query that touches a tenant-scoped table MUST include a `tenantId`
filter in the WHERE clause. No exceptions. Missing this is a data leak bug, not a style issue.

### Correct Pattern

```typescript
// ✅ CORRECT — tenantId manually injected
const conflicts = await this.prisma.$queryRaw<Booking[]>`
  SELECT *
  FROM bookings
  WHERE tenant_id = ${tenantId}
    AND equipment_id = ${equipmentId}
    AND booking_range && ${range}::tstzrange
`;
```

```typescript
// ❌ WRONG — tenantId missing, exposes data across tenants
const conflicts = await this.prisma.$queryRaw<Booking[]>`
  SELECT *
  FROM bookings
  WHERE equipment_id = ${equipmentId}
    AND booking_range && ${range}::tstzrange
`;
```

## SQL Injection Prevention

Always use Prisma's tagged template literals for variable interpolation.
Never concatenate raw strings into queries.

```typescript
// ✅ CORRECT — Prisma escapes all interpolated values
await this.prisma.$queryRaw`SELECT * FROM bookings WHERE tenant_id = ${tenantId}`;

// ❌ WRONG — SQL injection risk
await this.prisma.$queryRaw(Prisma.raw(`SELECT * FROM bookings WHERE tenant_id = '${tenantId}'`));
```

## Checklist Before Submitting Any Raw SQL

- [ ] Does the query touch a tenant-scoped table?
- [ ] Is `tenant_id = ${tenantId}` present in the WHERE clause?
- [ ] Are all variables interpolated via template literals, not string concatenation?
