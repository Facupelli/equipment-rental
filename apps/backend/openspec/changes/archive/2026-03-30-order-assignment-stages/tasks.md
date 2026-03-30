## 1. Schema And Assignment Contracts

- [x] 1.1 Add an order-assignment stage enum/column to `asset_assignments` and backfill existing `ORDER` rows based on linked order status
- [x] 1.2 Update database constraints so `ORDER` assignments require a stage and non-order assignments require a null stage
- [x] 1.3 Update shared assignment enums/contracts and inventory domain mapping so order-backed assignments carry `HOLD` or `COMMITTED`

## 2. Inventory Persistence And Availability

- [x] 2.1 Update asset assignment persistence and reconstitution paths to read and write the new order-assignment stage
- [x] 2.2 Add inventory-side operations to convert order assignments from `HOLD` to `COMMITTED` and to release order assignments by stage
- [x] 2.3 Update availability queries so both `HOLD` and `COMMITTED` order assignments remain blocking while non-order semantics stay unchanged

## 3. Order Creation And Lifecycle Flows

- [x] 3.1 Update order creation so request-to-book orders persist `HOLD` assignments and instant-book orders persist `COMMITTED` assignments
- [x] 3.2 Update confirm-order flow to transition the order and convert related assignments from `HOLD` to `COMMITTED` in one transaction
- [x] 3.3 Update reject-order and expire-order flows to transition the order and release related `HOLD` assignments in one transaction
- [x] 3.4 Update cancel-order flow to transition the order and release related `COMMITTED` assignments in one transaction

## 4. Verification

- [x] 4.1 Extend unit tests for create-order and lifecycle handlers to cover stage creation, conversion, and release behavior
- [x] 4.2 Extend inventory integration tests to verify overlap blocking for `HOLD` and `COMMITTED` assignments and availability release after rejection, expiry, and cancellation
- [x] 4.3 Run the relevant backend test suite and confirm the new assignment-stage behavior passes end to end
