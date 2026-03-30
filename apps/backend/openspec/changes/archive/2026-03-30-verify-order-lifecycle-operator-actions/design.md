## Context

The `order` module already implements the operator lifecycle commands and HTTP endpoints for confirm, reject, cancel, activate, and complete. Existing coverage proves domain transitions and some command-side inventory interactions, but it does not yet verify the full operator surface over HTTP with real guard behavior, persistence, and assignment side effects. The main product clarification needed for MVP is that `COMPLETED` is a status-only transition that preserves assignment records as historical fulfillment evidence.

## Goals / Non-Goals

**Goals:**

- Add DB-backed HTTP integration coverage for operator lifecycle endpoints.
- Verify operator-only authorization and invalid-transition error handling at the HTTP boundary.
- Verify assignment mutations for confirm, reject, and cancel.
- Verify that activate and complete preserve assignment rows.
- Lock in MVP semantics that completion does not release or delete historical assignments.

**Non-Goals:**

- Introduce new order lifecycle states or new operator actions.
- Change the fulfillment or availability model beyond clarifying completed-order semantics.
- Add return-condition, damage, settlement, or post-completion workflows.
- Replace existing unit tests with end-to-end auth flows.

## Decisions

### Use HTTP integration tests instead of full end-to-end tests

The change will add `.int-spec.ts` coverage colocated with the `order` module, following the precedent established by inventory integration tests. This keeps the tests close to the module, exercises real Nest routing and persistence, and avoids the overhead of a separate full-application e2e harness.

Alternative considered: top-level e2e tests under `test/`. Rejected because the project does not currently use that style for this kind of module-scoped database verification, and it would add harness complexity without improving confidence in the slice's main risks.

### Verify lifecycle behavior through HTTP plus direct database assertions

Each operator transition will be exercised through its HTTP endpoint, then asserted against persisted order state and assignment rows. This proves controller wiring, guard behavior, command execution, transaction boundaries, and inventory side effects in one test layer.

Alternative considered: add only controller tests and service unit tests. Rejected because mocked tests would not prove the assignment stage mutation and release behavior that slice 2.3 now exists to harden.

### Preserve assignment records on completion

`COMPLETE` remains a status transition only. The implementation and tests will treat the assignment row as historical fulfillment evidence. Availability is governed by overlap between an asset assignment period and the requested booking period, so once the period is in the past, the asset becomes available naturally without deleting the historical assignment.

Alternative considered: release or delete assignments on completion. Rejected for MVP because it discards audit history, weakens reporting and schedule history, and is unnecessary for availability calculations.

### Keep unit additions focused on uncovered services

Existing tests already cover domain transitions and command-side side effects for confirm, reject, expire, and cancel. New unit work should stay small and focus on `ActivateOrderService` and `CompleteOrderService`, especially their not-found and invalid-transition mappings.

Alternative considered: expand unit coverage for every lifecycle command. Rejected because the highest-value missing confidence is at the HTTP and persistence boundary rather than inside already-tested command flows.

## Risks / Trade-offs

- [HTTP integration setup may be heavier than expected] -> Reuse the existing Nest testing-module and Prisma integration pattern already used in inventory integration tests.
- [Authorization setup may become the slowest part of the slice] -> Seed or stub only the minimum authenticated operator and customer identities needed to prove `UserOnlyGuard` behavior.
- [Historical assignment preservation could be misread later as an active reservation] -> Make the spec explicit that preserved completed assignments are historical records and that availability depends on overlap with the stored rental period.
- [A single large lifecycle integration spec could become noisy] -> Group tests by transition and keep shared fixture builders focused on order state plus assignment stage.
