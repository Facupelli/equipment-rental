## ADDED Requirements

### Requirement: Tenant config stores booking mode

The system SHALL store a tenant-scoped `bookingMode` setting in tenant config and only accept the values `instant-book` and `request-to-book`.

#### Scenario: New tenant config uses the default booking mode

- **WHEN** a tenant config is created without an explicit booking mode
- **THEN** the system sets `bookingMode` to `instant-book`

#### Scenario: Tenant updates booking mode with an allowed value

- **WHEN** an authenticated operator updates tenant config with `bookingMode` set to `instant-book` or `request-to-book`
- **THEN** the system persists the provided value for that tenant

#### Scenario: Tenant updates booking mode with an invalid value

- **WHEN** an update payload includes a `bookingMode` value outside the allowed set
- **THEN** the system rejects the update and does not change the tenant config

### Requirement: Tenant config read models expose booking mode

The system SHALL include `bookingMode` in tenant config read responses so downstream consumers can determine the tenant booking policy from the existing config contract.

#### Scenario: Reading tenant config after booking mode is configured

- **WHEN** a tenant config is queried after `bookingMode` has been stored
- **THEN** the response includes the persisted `bookingMode` value

#### Scenario: Reading legacy tenant config without a stored booking mode

- **WHEN** a tenant config created before this change is queried and its persisted config does not include `bookingMode`
- **THEN** the response includes `bookingMode` as `instant-book`
