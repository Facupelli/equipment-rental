# Spec-Driven Development

Before writing any non-trivial code, produce a spec file and wait for explicit confirmation. Do not write implementation code until approved.

## What Counts as Non-Trivial

- Any new Use Case, Command Handler, or Query Handler
- Any change to booking, pricing, availability, or inventory logic
- Any new module or cross-module interaction
- Any raw SQL query

## Spec Format

Create the spec at `specs/<feature-name>.md`.

```markdown
## Spec: <Feature Name>

### What

One paragraph describing what this feature does and why.

### Layers Touched

List which layers and modules are affected.
Example: OrderModule > Application, InventoryModule > Domain

### Implementation Plan

Step-by-step. Name every file that will be created or modified.

### Edge Cases

Every edge case identified. For bookings always consider:

- Asset double-booking under concurrent requests
- IDENTIFIED vs POOLED tracking mode differences
- Bundle partial availability (one component unavailable)
- Order state machine — which transitions are legal from current status
- Procurement path (no owned asset available, PENDING_SOURCING)
- Tenant isolation — is tenantId correctly scoped?

### Acceptance Criteria

Concrete, testable statements of done.

- [ ] A POOLED asset cannot be double-booked for overlapping periods
- [ ] Bundle booking fails atomically if any component is unavailable
- [ ] Order status only transitions through the state machine service
- [ ] etc.

### Open Questions

Anything ambiguous requiring human clarification before proceeding.
```

After writing the spec, stop. Ask for confirmation. Do not proceed until approved.
