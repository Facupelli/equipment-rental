## Purpose

Define how request-to-book submissions create review-aware bookings, reserve inventory immediately, and appear in operator-facing review surfaces.

## Requirements

### Requirement: Booking mode determines the initial order lifecycle state

The system SHALL create new orders in a lifecycle state derived from the tenant booking mode. `instant-book` submissions MUST create orders in `CONFIRMED`. `request-to-book` submissions MUST create orders in `PENDING_REVIEW`.

#### Scenario: Instant-book submission creates a confirmed order

- **WHEN** a customer submits a booking for a tenant configured with `instant-book`
- **THEN** the system creates the order in `CONFIRMED`

#### Scenario: Request-to-book submission creates a pending review order

- **WHEN** a customer submits a booking for a tenant configured with `request-to-book`
- **THEN** the system creates the order in `PENDING_REVIEW`

### Requirement: Order lifecycle SHALL use review-aware booking states

The system SHALL represent the booking lifecycle using `PENDING_REVIEW`, `CONFIRMED`, `REJECTED`, `EXPIRED`, `ACTIVE`, `COMPLETED`, and `CANCELLED`. The system MUST NOT use `PENDING_SOURCING` or `SOURCED` as order lifecycle states.

#### Scenario: Persisted order exposes only review-aware lifecycle states

- **WHEN** an order is created or updated after this change
- **THEN** its status is one of `PENDING_REVIEW`, `CONFIRMED`, `REJECTED`, `EXPIRED`, `ACTIVE`, `COMPLETED`, or `CANCELLED`

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

### Requirement: Order-backed assignments SHALL distinguish hold and committed stages

The system SHALL represent order-backed inventory assignments using explicit stages. `HOLD` SHALL represent a temporary pending-review reservation, and `COMMITTED` SHALL represent confirmed fulfillment. Non-order assignment types MUST NOT use an order-assignment stage.

#### Scenario: Order assignment stores an explicit stage

- **WHEN** the system persists an assignment linked to an order
- **THEN** the assignment is stored with stage `HOLD` or `COMMITTED`

#### Scenario: Non-order assignment has no order stage

- **WHEN** the system persists a `BLACKOUT` or `MAINTENANCE` assignment
- **THEN** the assignment has no order-assignment stage

### Requirement: Hold and committed order assignments SHALL both block availability

The system SHALL treat `HOLD` and `COMMITTED` order assignments as availability-blocking while they exist. Any relevant availability read that represents fulfillable inventory, including storefront-facing product and bundle availability for a user-requested rental period, MUST apply the same blocking interpretation. Reads covered by this requirement MUST NOT assume that only confirmed bookings block availability.

#### Scenario: Hold assignment blocks overlapping booking

- **WHEN** an asset has an overlapping order assignment in stage `HOLD`
- **THEN** the system does not consider that asset available for another booking in the overlapping period

#### Scenario: Committed assignment blocks overlapping booking

- **WHEN** an asset has an overlapping order assignment in stage `COMMITTED`
- **THEN** the system does not consider that asset available for another booking in the overlapping period

#### Scenario: Storefront availability read does not ignore hold assignments

- **WHEN** a storefront-facing availability read evaluates assets with overlapping order assignments in stage `HOLD`
- **THEN** the read excludes those assets from the available inventory it presents

#### Scenario: Storefront availability read does not ignore committed assignments

- **WHEN** a storefront-facing availability read evaluates assets with overlapping order assignments in stage `COMMITTED`
- **THEN** the read excludes those assets from the available inventory it presents

#### Scenario: Storefront availability read uses the requested rental period

- **WHEN** a storefront-facing availability read is requested for a rental period
- **THEN** the read evaluates hold and committed assignment overlap against that requested rental period

### Requirement: Order period SHALL be owned by the order record

The system SHALL persist the booked rental period on the order so the commercial booking remains readable independently of assignment lifecycle changes.

#### Scenario: Order detail retains booking period after assignment lifecycle changes

- **WHEN** an order is read after fulfillment assignments have changed or been released
- **THEN** the system returns the booked rental period from order-owned data

### Requirement: Pending review orders SHALL be visible in a dedicated review-oriented view

The system SHALL expose `PENDING_REVIEW` orders in a dedicated operator-facing review-oriented view. General schedule and calendar views for active operations MUST NOT include `PENDING_REVIEW` orders unless those views are explicitly defined as availability-sensitive review surfaces.

#### Scenario: Pending review order appears in the review queue

- **WHEN** an operator requests the dedicated pending review view
- **THEN** the system includes orders in `PENDING_REVIEW`

#### Scenario: Pending review order is excluded from general operational schedule views

- **WHEN** an operator requests a general schedule or calendar view for active operations
- **THEN** the system excludes orders in `PENDING_REVIEW`
