## Purpose

Define which lifecycle actions staff users can take on review-aware bookings and the valid state transitions for confirmation, rejection, cancellation, fulfillment, and expiry.

## Requirements

### Requirement: Staff lifecycle actions SHALL be verified over HTTP

The system SHALL expose staff lifecycle actions through staff-only HTTP endpoints that execute the same lifecycle semantics as the command layer. Each endpoint SHALL return `204 No Content` on success, `403 Forbidden` when the caller is not an authorized staff user for that action, `404 Not Found` when the order does not exist for the staff user's tenant, and `422 Unprocessable Entity` when the requested lifecycle transition is not allowed from the current state.

#### Scenario: Authorized staff user confirms an order over HTTP

- **WHEN** an authenticated staff user with the required permission sends the confirm request for an existing order in `PENDING_REVIEW`
- **THEN** the system responds with `204 No Content`

#### Scenario: Unauthorized staff user is forbidden from a lifecycle action

- **WHEN** an authenticated staff user without the required permission sends a lifecycle request
- **THEN** the system responds with `403 Forbidden`

#### Scenario: Invalid lifecycle action returns an HTTP validation error

- **WHEN** an authorized staff user sends a lifecycle request that is not allowed from the order's current state
- **THEN** the system responds with `422 Unprocessable Entity`

#### Scenario: Unknown order returns an HTTP not found error

- **WHEN** an authorized staff user sends a lifecycle request for an order that does not exist in the staff user's tenant
- **THEN** the system responds with `404 Not Found`

### Requirement: Staff lifecycle endpoints SHALL be restricted to authorized staff users

The system SHALL restrict confirm, reject, cancel, activate, and complete endpoints to authenticated staff users that hold the required order lifecycle permission for the tenant. Customer callers and staff users without the required permission MUST NOT be allowed to execute staff lifecycle actions.

#### Scenario: Authorized staff user can access a lifecycle endpoint

- **WHEN** an authenticated staff user with the required permission sends a lifecycle request
- **THEN** the system evaluates and executes the request normally

#### Scenario: Customer cannot access a lifecycle endpoint

- **WHEN** an authenticated customer sends a lifecycle request
- **THEN** the system responds with `403 Forbidden`

#### Scenario: Staff user without permission cannot access a lifecycle endpoint

- **WHEN** an authenticated staff user without the required permission sends a lifecycle request
- **THEN** the system responds with `403 Forbidden`

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

### Requirement: Expiry is a terminal pending review outcome

The system SHALL allow orders in `PENDING_REVIEW` to transition to `EXPIRED` when the review window lapses without operator action. Expired orders MUST remain readable as expired review outcomes. Expiry SHALL release the order's related `HOLD` assignments.

#### Scenario: Pending review booking expires without review

- **WHEN** a pending review order passes its review deadline without confirmation or rejection
- **THEN** the system transitions the order to `EXPIRED`
- **AND** the system releases the order's related `HOLD` assignments

#### Scenario: Expired booking remains readable

- **WHEN** an operator reads an order in `EXPIRED`
- **THEN** the system returns the order with status `EXPIRED`
