## MODIFIED Requirements

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
