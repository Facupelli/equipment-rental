## Why

Epic 2 slice 2.3 is no longer primarily about adding operator lifecycle actions because the core confirm, reject, cancel, activate, and complete flows already exist. The remaining gap is confidence: the system needs explicit requirements and implementation work to verify these transitions over HTTP, prove their inventory side effects, and lock in MVP semantics for `COMPLETED` as a status-only transition that preserves historical assignment records.

## What Changes

- Refocus slice 2.3 from implementing operator lifecycle actions to verifying and hardening the existing operator lifecycle surface.
- Define HTTP-level requirements for operator lifecycle endpoints, including successful transitions, invalid transition handling, and operator-only authorization.
- Define persistence expectations for assignment side effects: confirm converts `HOLD` to `COMMITTED`, reject releases `HOLD`, cancel releases `COMMITTED`, and activate/complete do not mutate assignments.
- Confirm MVP semantics that completing an order preserves assignment history and relies on the order period for natural availability release rather than deleting or releasing the historical assignment row.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `operator-order-lifecycle-actions`: extend the lifecycle requirements so they explicitly cover HTTP verification, authorization, error behavior, and the MVP rule that `COMPLETED` preserves assignment history without releasing it.

## Impact

- Affects `src/modules/order/application/commands/**` and the operator lifecycle HTTP controllers.
- Affects integration coverage for the `order` module and DB-backed verification of assignment mutations through `InventoryPublicApi`.
- Clarifies the product contract for completed orders without introducing a new external API surface.
