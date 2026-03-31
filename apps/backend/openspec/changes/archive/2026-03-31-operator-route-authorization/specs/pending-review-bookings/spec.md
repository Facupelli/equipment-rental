## MODIFIED Requirements

### Requirement: Pending review orders SHALL be visible in a dedicated review-oriented view

The system SHALL expose `PENDING_REVIEW` orders in a dedicated staff-facing review-oriented view. Access to that review-oriented view SHALL require an authenticated staff user with the required tenant-wide order review permission. General schedule and calendar views for active operations MUST NOT include `PENDING_REVIEW` orders unless those views are explicitly defined as availability-sensitive review surfaces.

#### Scenario: Authorized staff user requests the pending review view

- **WHEN** an authenticated staff user with the required order review permission requests the dedicated pending review view
- **THEN** the system includes orders in `PENDING_REVIEW`

#### Scenario: Staff user without permission cannot access the pending review view

- **WHEN** an authenticated staff user without the required order review permission requests the dedicated pending review view
- **THEN** the system responds with `403 Forbidden`

#### Scenario: Customer cannot access the pending review view

- **WHEN** an authenticated customer requests the dedicated pending review view
- **THEN** the system responds with `403 Forbidden`

#### Scenario: Pending review order is excluded from general operational schedule views

- **WHEN** a staff user requests a general schedule or calendar view for active operations
- **THEN** the system excludes orders in `PENDING_REVIEW`
