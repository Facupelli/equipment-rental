## ADDED Requirements

### Requirement: Operators can confirm pending review bookings

The system SHALL allow an operator to confirm an order only when the order is in `PENDING_REVIEW`. Confirming the order SHALL transition it to `CONFIRMED`.

#### Scenario: Operator confirms a pending review booking

- **WHEN** an operator confirms an order in `PENDING_REVIEW`
- **THEN** the system transitions the order to `CONFIRMED`

#### Scenario: Operator cannot confirm a non-pending-review order

- **WHEN** an operator attempts to confirm an order that is not in `PENDING_REVIEW`
- **THEN** the system rejects the action as an invalid state transition

### Requirement: Operators can reject pending review bookings

The system SHALL allow an operator to reject an order only when the order is in `PENDING_REVIEW`. Rejecting the order SHALL transition it to `REJECTED`.

#### Scenario: Operator rejects a pending review booking

- **WHEN** an operator rejects an order in `PENDING_REVIEW`
- **THEN** the system transitions the order to `REJECTED`

#### Scenario: Operator cannot reject a non-pending-review order

- **WHEN** an operator attempts to reject an order that is not in `PENDING_REVIEW`
- **THEN** the system rejects the action as an invalid state transition

### Requirement: Cancellation is limited to confirmed bookings

The system SHALL allow cancellation only when an order is in `CONFIRMED`. `PENDING_REVIEW` orders MUST use rejection or expiry outcomes instead of cancellation.

#### Scenario: Operator cancels a confirmed booking

- **WHEN** an operator cancels an order in `CONFIRMED`
- **THEN** the system transitions the order to `CANCELLED`

#### Scenario: Operator cannot cancel a pending review booking

- **WHEN** an operator attempts to cancel an order in `PENDING_REVIEW`
- **THEN** the system rejects the action as an invalid state transition

### Requirement: Confirmed bookings can progress through fulfillment states

The system SHALL allow only confirmed bookings to move into operational fulfillment. A `CONFIRMED` order MAY transition to `ACTIVE`, and an `ACTIVE` order MAY transition to `COMPLETED`.

#### Scenario: Operator activates a confirmed booking

- **WHEN** an operator activates an order in `CONFIRMED`
- **THEN** the system transitions the order to `ACTIVE`

#### Scenario: Operator completes an active booking

- **WHEN** an operator completes an order in `ACTIVE`
- **THEN** the system transitions the order to `COMPLETED`

#### Scenario: Operator cannot complete a non-active booking

- **WHEN** an operator attempts to complete an order that is not in `ACTIVE`
- **THEN** the system rejects the action as an invalid state transition

### Requirement: Expiry is a terminal pending review outcome

The system SHALL allow orders in `PENDING_REVIEW` to transition to `EXPIRED` when the review window lapses without operator action. Expired orders MUST remain readable as expired review outcomes.

#### Scenario: Pending review booking expires without review

- **WHEN** a pending review order passes its review deadline without confirmation or rejection
- **THEN** the system transitions the order to `EXPIRED`

#### Scenario: Expired booking remains readable

- **WHEN** an operator reads an order in `EXPIRED`
- **THEN** the system returns the order with status `EXPIRED`
