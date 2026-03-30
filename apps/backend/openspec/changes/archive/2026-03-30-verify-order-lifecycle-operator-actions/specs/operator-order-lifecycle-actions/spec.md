## ADDED Requirements

### Requirement: Operator lifecycle actions SHALL be verified over HTTP

The system SHALL expose operator lifecycle actions through operator-only HTTP endpoints that execute the same lifecycle semantics as the command layer. Each endpoint SHALL return `204 No Content` on success, `404 Not Found` when the order does not exist for the operator's tenant, and `422 Unprocessable Entity` when the requested lifecycle transition is not allowed from the current state.

#### Scenario: Operator confirms an order over HTTP

- **WHEN** an authenticated operator sends the confirm request for an existing order in `PENDING_REVIEW`
- **THEN** the system responds with `204 No Content`

#### Scenario: Invalid lifecycle action returns an HTTP validation error

- **WHEN** an authenticated operator sends a lifecycle request that is not allowed from the order's current state
- **THEN** the system responds with `422 Unprocessable Entity`

#### Scenario: Unknown order returns an HTTP not found error

- **WHEN** an authenticated operator sends a lifecycle request for an order that does not exist in the operator's tenant
- **THEN** the system responds with `404 Not Found`

### Requirement: Operator lifecycle endpoints SHALL be restricted to operators

The system SHALL restrict confirm, reject, cancel, activate, and complete endpoints to operator users. Customer callers MUST NOT be allowed to execute operator lifecycle actions.

#### Scenario: Operator can access a lifecycle endpoint

- **WHEN** an authenticated operator sends a lifecycle request
- **THEN** the system evaluates and executes the request normally

#### Scenario: Customer cannot access a lifecycle endpoint

- **WHEN** an authenticated customer sends a lifecycle request
- **THEN** the system responds with `403 Forbidden`

## MODIFIED Requirements

### Requirement: Operators can confirm pending review bookings

The system SHALL allow an operator to confirm an order only when the order is in `PENDING_REVIEW`. Confirming the order SHALL transition it to `CONFIRMED` and SHALL convert its order-backed assignments from stage `HOLD` to stage `COMMITTED` in the same transaction.

#### Scenario: Operator confirms a pending review booking

- **WHEN** an operator confirms an order in `PENDING_REVIEW`
- **THEN** the system transitions the order to `CONFIRMED`
- **AND** the system converts the order's related order assignments from `HOLD` to `COMMITTED`

#### Scenario: Operator cannot confirm a non-pending-review order

- **WHEN** an operator attempts to confirm an order that is not in `PENDING_REVIEW`
- **THEN** the system rejects the action as an invalid state transition

### Requirement: Operators can reject pending review bookings

The system SHALL allow an operator to reject an order only when the order is in `PENDING_REVIEW`. Rejecting the order SHALL transition it to `REJECTED` and SHALL release its `HOLD` assignments.

#### Scenario: Operator rejects a pending review booking

- **WHEN** an operator rejects an order in `PENDING_REVIEW`
- **THEN** the system transitions the order to `REJECTED`
- **AND** the system releases the order's related `HOLD` assignments

#### Scenario: Operator cannot reject a non-pending-review order

- **WHEN** an operator attempts to reject an order that is not in `PENDING_REVIEW`
- **THEN** the system rejects the action as an invalid state transition

### Requirement: Cancellation is limited to confirmed bookings

The system SHALL allow cancellation only when an order is in `CONFIRMED`. `PENDING_REVIEW` orders MUST use rejection or expiry outcomes instead of cancellation. Cancelling a confirmed booking SHALL release its `COMMITTED` assignments.

#### Scenario: Operator cancels a confirmed booking

- **WHEN** an operator cancels an order in `CONFIRMED`
- **THEN** the system transitions the order to `CANCELLED`
- **AND** the system releases the order's related `COMMITTED` assignments

#### Scenario: Operator cannot cancel a pending review booking

- **WHEN** an operator attempts to cancel an order in `PENDING_REVIEW`
- **THEN** the system rejects the action as an invalid state transition

### Requirement: Confirmed bookings can progress through fulfillment states

The system SHALL allow only confirmed bookings to move into operational fulfillment. A `CONFIRMED` order MAY transition to `ACTIVE`, and an `ACTIVE` order MAY transition to `COMPLETED`. Activating or completing an order SHALL NOT release or delete its order-backed assignments. Completing an order SHALL preserve its assignment records as historical fulfillment evidence.

#### Scenario: Operator activates a confirmed booking

- **WHEN** an operator activates an order in `CONFIRMED`
- **THEN** the system transitions the order to `ACTIVE`
- **AND** the system leaves the order's assignments unchanged

#### Scenario: Operator completes an active booking

- **WHEN** an operator completes an order in `ACTIVE`
- **THEN** the system transitions the order to `COMPLETED`
- **AND** the system preserves the order's assignments as historical records

#### Scenario: Operator cannot complete a non-active booking

- **WHEN** an operator attempts to complete an order that is not in `ACTIVE`
- **THEN** the system rejects the action as an invalid state transition
