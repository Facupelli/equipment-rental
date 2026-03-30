## 1. HTTP integration lifecycle coverage

- [x] 1.1 Add a DB-backed HTTP integration spec for operator lifecycle endpoints alongside the `order` module using the `.int-spec.ts` convention.
- [x] 1.2 Cover successful confirm, reject, cancel, activate, and complete requests with assertions on persisted order status changes.
- [x] 1.3 Assert assignment side effects in the integration spec: confirm converts `HOLD` to `COMMITTED`, reject removes `HOLD`, cancel removes `COMMITTED`, and activate/complete leave assignments unchanged.

## 2. Authorization and error handling verification

- [x] 2.1 Verify operator-only access on confirm, reject, cancel, activate, and complete endpoints, including rejection of customer callers.
- [x] 2.2 Verify HTTP error mapping for missing orders and invalid lifecycle transitions, including `404 Not Found` and `422 Unprocessable Entity` responses.
- [x] 2.3 Add explicit integration coverage that `complete` preserves historical assignment records instead of releasing them.

## 3. Focused unit hardening

- [x] 3.1 Add `ActivateOrderService` unit coverage for success, missing-order, and invalid-transition cases.
- [x] 3.2 Add `CompleteOrderService` unit coverage for success, missing-order, and invalid-transition cases.
- [x] 3.3 Run the relevant order module tests and confirm the new lifecycle verification coverage passes.
