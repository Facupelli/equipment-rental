---
name: module-boundary-review
description: >
  Reviews backend changes for cross-module boundary violations and public-contract misuse.
  Use this skill when a change touches more than one backend module or introduces new dependencies between modules.
---

# Module Boundary Review

Use this skill to audit whether a backend change respects bounded-context rules.

## Review focus

- Cross-module imports only come from public surfaces.
- `CommandBus` is not used as an ad hoc cross-module integration shortcut.
- Query contracts are public when consumed across modules.
- No private application, domain, or infrastructure files leak across module boundaries.

## What to report

- findings first
- concrete file references
- the safer public-contract alternative when possible

## Repository anchors

- boundary rules: `docs/agent-rules/architecture.md`
- public query example: `src/modules/tenant/public/queries/get-location-context.query.ts`
- public event example: `src/modules/order/public/events/order-created-by-customer.event.ts`
