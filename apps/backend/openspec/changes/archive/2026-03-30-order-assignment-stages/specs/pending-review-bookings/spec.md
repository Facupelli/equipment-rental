## MODIFIED Requirements

### Requirement: Pending review bookings SHALL reserve inventory immediately

The system SHALL create inventory-blocking order assignments for `request-to-book` submissions during the booking transaction so pending-review orders block availability before operator review. These order-backed assignments MUST be persisted in the `HOLD` stage rather than as committed fulfillment assignments.

#### Scenario: Pending review booking creates blocking hold assignments immediately

- **WHEN** a `request-to-book` booking is accepted for submission
- **THEN** the system persists availability-blocking order assignments for the booked period in the same transaction as the order
- **AND** each persisted order assignment is in stage `HOLD`

#### Scenario: Instant-book booking creates committed order assignments immediately

- **WHEN** an `instant-book` booking is accepted for submission
- **THEN** the system persists availability-blocking order assignments for the booked period in the same transaction as the order
- **AND** each persisted order assignment is in stage `COMMITTED`

## ADDED Requirements

### Requirement: Order-backed assignments SHALL distinguish hold and committed stages

The system SHALL represent order-backed inventory assignments using explicit stages. `HOLD` SHALL represent a temporary pending-review reservation, and `COMMITTED` SHALL represent confirmed fulfillment. Non-order assignment types MUST NOT use an order-assignment stage.

#### Scenario: Order assignment stores an explicit stage

- **WHEN** the system persists an assignment linked to an order
- **THEN** the assignment is stored with stage `HOLD` or `COMMITTED`

#### Scenario: Non-order assignment has no order stage

- **WHEN** the system persists a `BLACKOUT` or `MAINTENANCE` assignment
- **THEN** the assignment has no order-assignment stage

### Requirement: Hold and committed order assignments SHALL both block availability

The system SHALL treat `HOLD` and `COMMITTED` order assignments as availability-blocking while they exist.

#### Scenario: Hold assignment blocks overlapping booking

- **WHEN** an asset has an overlapping order assignment in stage `HOLD`
- **THEN** the system does not consider that asset available for another booking in the overlapping period

#### Scenario: Committed assignment blocks overlapping booking

- **WHEN** an asset has an overlapping order assignment in stage `COMMITTED`
- **THEN** the system does not consider that asset available for another booking in the overlapping period
