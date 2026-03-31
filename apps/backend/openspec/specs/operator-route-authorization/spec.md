## Purpose

Define tenant-wide authorization rules for launch-critical staff routes so customer actors are blocked from back-office endpoints and staff access is gated by explicit route permissions derived from assigned roles.

## Requirements

### Requirement: Launch-critical staff routes SHALL reject customer actors

The system SHALL require launch-critical back-office HTTP endpoints to execute only in authenticated tenant staff actor context. Authenticated `CUSTOMER` actors MUST receive `403 Forbidden` instead of reaching staff route controller logic.

Launch-critical staff routes in this slice include:

- order review and lifecycle endpoints
- order detail, review queue, schedule, and calendar operator reads
- customer back-office reads
- catalog back-office reads and mutations
- inventory back-office reads and mutations
- pricing back-office reads and mutations
- tenant configuration, owners, locations, and billing-unit management routes

#### Scenario: Customer actor calls a launch-critical operator mutation route

- **WHEN** an authenticated customer sends a request to a launch-critical operator mutation endpoint
- **THEN** the system responds with `403 Forbidden`
- **AND** the endpoint does not execute its command-side use case

#### Scenario: Customer actor calls a launch-critical operator read route

- **WHEN** an authenticated customer sends a request to a launch-critical operator read endpoint
- **THEN** the system responds with `403 Forbidden`
- **AND** the endpoint does not execute its query-side use case

### Requirement: Launch-critical staff routes SHALL declare tenant-wide permission requirements

The system SHALL require each launch-critical staff route in this slice to declare explicit actor metadata and an explicit tenant-wide permission requirement unless the route is intentionally limited to authenticated staff self-context only. Authorization decisions for this slice MUST NOT depend on location-scoped role filtering.

#### Scenario: Launch-critical staff route declares actor and permission metadata

- **WHEN** a launch-critical staff route is included in scope for this slice
- **THEN** the route declares that it is staff-only
- **AND** the route declares the permission required to execute it

#### Scenario: Operator self-context route stays actor-only

- **WHEN** an operator route returns the authenticated operator's own context and does not expose broader back-office capability
- **THEN** the route may be restricted by operator actor type without requiring an additional permission declaration

### Requirement: Tenant-wide staff permissions SHALL be derived from assigned roles

The system SHALL evaluate operator permissions from the authenticated user's assigned roles for the tenant. The effective permission set SHALL be the union of permissions granted by the user's role assignments, and permission changes in persisted role data SHALL be reflected without requiring JWT reissue.

#### Scenario: Operator receives permission through any assigned role

- **WHEN** an operator has multiple assigned roles and at least one role grants the route's required permission
- **THEN** the system authorizes the route request

#### Scenario: Persisted role change affects the next authorized request

- **WHEN** a role assignment or role permission changes for an operator
- **THEN** the next authorization evaluation uses the updated persisted permissions

### Requirement: Missing staff permission SHALL produce forbidden responses

The system SHALL reject launch-critical operator requests when the authenticated operator lacks the route's required permission. The response SHALL be `403 Forbidden` and the system MUST NOT execute the underlying command or query handler through that route.

#### Scenario: Operator lacks permission for a launch-critical read

- **WHEN** an authenticated operator calls a launch-critical read endpoint without the required permission
- **THEN** the system responds with `403 Forbidden`
- **AND** the system does not execute the route's query-side use case

#### Scenario: Operator lacks permission for a launch-critical mutation

- **WHEN** an authenticated operator calls a launch-critical mutation endpoint without the required permission
- **THEN** the system responds with `403 Forbidden`
- **AND** the system does not execute the route's command-side use case

### Requirement: Launch-critical staff routes SHALL map to explicit permissions

The system SHALL use the existing permission model to authorize launch-critical operator routes in this slice. At minimum, route authorization SHALL distinguish between viewing and managing orders, customers, catalog, assets, pricing, locations, owners, users, roles, and tenant-management surfaces according to the existing permission enum.

#### Scenario: Catalog back-office mutation requires a catalog management permission

- **WHEN** an operator calls a launch-critical catalog mutation route
- **THEN** the route requires the corresponding catalog management permission rather than only authentication

#### Scenario: Pricing back-office read requires a pricing view permission

- **WHEN** an operator calls a launch-critical pricing read route
- **THEN** the route requires a pricing read permission rather than only authentication
