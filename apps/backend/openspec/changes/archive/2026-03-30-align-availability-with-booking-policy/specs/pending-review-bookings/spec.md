## MODIFIED Requirements

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
