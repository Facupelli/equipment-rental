## Purpose

Define the booking guardrails that customer-facing cart preview and order creation must enforce so storefront booking only succeeds for active catalog items, valid tenant/location context, and the authenticated customer identity.

## Requirements

### Requirement: Customer-facing booking flows SHALL reject inactive catalog items

The system SHALL reject customer-facing cart preview and order creation requests for products or bundles that are unpublished or retired, even when the caller supplies a valid entity identifier.

#### Scenario: Cart preview rejects an unpublished product

- **WHEN** a customer cart preview request includes a product whose `publishedAt` is null
- **THEN** the system rejects the request as ineligible for storefront booking

#### Scenario: Order creation rejects a retired bundle

- **WHEN** a customer order creation request includes a bundle whose `retiredAt` is not null
- **THEN** the system rejects the request as ineligible for storefront booking

### Requirement: Customer-facing booking flows SHALL validate tenant and location booking context

The system SHALL validate that customer-facing cart preview and order creation requests reference a booking location that belongs to the authenticated tenant and that the requested catalog items remain eligible for that booking context before pricing or order creation proceeds.

#### Scenario: Request rejects a location outside the authenticated tenant

- **WHEN** a customer booking or cart preview request references a location that does not belong to the authenticated tenant
- **THEN** the system rejects the request before schedule, pricing, or allocation work proceeds

#### Scenario: Request rejects a catalog item with no valid booking context at the requested location

- **WHEN** a customer booking or cart preview request references a catalog item that is not storefront-eligible for the requested location context
- **THEN** the system rejects the request instead of treating the item as bookable by identifier alone

### Requirement: Customer booking endpoints SHALL bind booking identity to the authenticated customer

The system SHALL require customer-facing booking endpoints to execute in authenticated customer context and SHALL derive booking ownership from that authenticated customer rather than from caller-supplied customer identifiers.

#### Scenario: Non-customer actor cannot create a customer booking

- **WHEN** a non-customer actor calls a customer-facing booking endpoint
- **THEN** the system rejects the request as forbidden

#### Scenario: Order creation ignores arbitrary customer identity supplied by the caller

- **WHEN** a customer-facing order creation request supplies a customer identifier that does not match the authenticated customer
- **THEN** the system creates or rejects the booking using the authenticated customer identity rather than the caller-supplied value

### Requirement: Customer cart preview SHALL enforce the same booking guardrails as order creation

The system SHALL apply the same catalog lifecycle and booking-context validation rules to customer cart preview that it applies to customer order creation so preview does not expose a rentable state that booking cannot legally submit.

#### Scenario: Cart preview and order creation reject the same retired product

- **WHEN** a retired product is supplied to both customer cart preview and customer order creation
- **THEN** both flows reject the product under the same storefront booking guardrail

#### Scenario: Cart preview and order creation reject the same invalid location context

- **WHEN** a customer requests cart preview and order creation for the same invalid location context
- **THEN** both flows reject the request before availability allocation or pricing success is returned
