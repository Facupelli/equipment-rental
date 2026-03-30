## ADDED Requirements

### Requirement: Storefront product availability SHALL use booking-policy blocking semantics

The system SHALL compute storefront product availability for the rental period requested by the user using the same inventory-blocking semantics used for booking-time allocation. Overlapping `ORDER` assignments in stage `HOLD` and stage `COMMITTED` MUST both reduce storefront product availability, and overlapping `BLACKOUT` and `MAINTENANCE` assignments MUST continue to reduce availability where applicable.

#### Scenario: Requested rental period drives storefront product availability

- **WHEN** a storefront product availability read is requested with a rental period
- **THEN** the system evaluates product availability against that requested period
- **AND** the system does not substitute a server-defined availability window

#### Scenario: Hold assignments reduce storefront product availability

- **WHEN** a storefront product availability read includes assets with overlapping `ORDER` assignments in stage `HOLD`
- **THEN** the system excludes those assets from the product's available quantity

#### Scenario: Committed assignments reduce storefront product availability

- **WHEN** a storefront product availability read includes assets with overlapping `ORDER` assignments in stage `COMMITTED`
- **THEN** the system excludes those assets from the product's available quantity

#### Scenario: Non-order blocking assignments reduce storefront product availability

- **WHEN** a storefront product availability read includes assets with overlapping `BLACKOUT` or `MAINTENANCE` assignments
- **THEN** the system excludes those assets from the product's available quantity

### Requirement: Storefront bundle availability SHALL be derived from component-level availability

The system SHALL determine storefront bundle availability for the rental period requested by the user from the fulfillability of all required bundle components under the same blocking semantics used for standalone products. A bundle MUST NOT be presented as available when any required component quantity cannot be satisfied.

#### Scenario: Bundle availability is reduced by blocked component inventory

- **WHEN** a bundle component product type has overlapping blocking assignments that leave fewer available assets than the component requires
- **THEN** the system does not present the bundle as available

#### Scenario: Bundle availability remains available when every component is satisfiable

- **WHEN** every required bundle component has enough unblocked assets to satisfy its required quantity
- **THEN** the system presents the bundle as available

### Requirement: Storefront-facing availability SHALL match operator-facing allocation semantics

The system SHALL use the same blocking interpretation for storefront availability reads that it uses during operator-facing booking allocation so that storefront catalog availability and booking-time asset resolution evaluate the same assignment states consistently.

#### Scenario: Storefront and allocation treat hold assignments the same way

- **WHEN** an overlapping `ORDER/HOLD` assignment exists for an asset
- **THEN** the storefront availability read and booking-time allocation both treat that asset as unavailable

#### Scenario: Storefront and allocation treat committed assignments the same way

- **WHEN** an overlapping `ORDER/COMMITTED` assignment exists for an asset
- **THEN** the storefront availability read and booking-time allocation both treat that asset as unavailable

### Requirement: Storefront availability SHALL consume inventory availability through a public read contract

The system SHALL expose inventory-owned availability counts to storefront catalog reads through an explicit public query contract rather than through direct cross-module service coupling or duplicate catalog-local blocking logic.

#### Scenario: Catalog reads inventory availability through a public query

- **WHEN** a storefront catalog read needs availability counts for one or more product types
- **THEN** the catalog module requests those counts through an inventory public query contract

#### Scenario: Public availability query supports batched product counts

- **WHEN** a storefront catalog read needs availability counts for multiple product types within the same requested period and location
- **THEN** the inventory public query contract returns availability counts for that batch in one read interaction
