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

### Requirement: Expiry is a terminal pending review outcome

The system SHALL allow orders in `PENDING_REVIEW` to transition to `EXPIRED` when the review window lapses without operator action. Expired orders MUST remain readable as expired review outcomes. Expiry SHALL release the order's related `HOLD` assignments.

#### Scenario: Pending review booking expires without review

- **WHEN** a pending review order passes its review deadline without confirmation or rejection
- **THEN** the system transitions the order to `EXPIRED`
- **AND** the system releases the order's related `HOLD` assignments

#### Scenario: Expired booking remains readable

- **WHEN** an operator reads an order in `EXPIRED`
- **THEN** the system returns the order with status `EXPIRED`
