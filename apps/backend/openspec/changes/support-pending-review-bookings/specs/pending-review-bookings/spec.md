## ADDED Requirements

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

The system SHALL create inventory-blocking reservations for `request-to-book` submissions during the booking transaction so pending-review orders block availability before operator review.

#### Scenario: Pending review booking holds availability immediately

- **WHEN** a `request-to-book` booking is accepted for submission
- **THEN** the system persists inventory-blocking reservations for the booked period in the same transaction as the order

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
