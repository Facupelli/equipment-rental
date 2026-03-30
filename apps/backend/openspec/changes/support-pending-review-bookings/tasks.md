## 1. Order Lifecycle Foundation

- [x] 1.1 Replace the Prisma `OrderStatus` enum and generated consumers to use `PENDING_REVIEW`, `CONFIRMED`, `REJECTED`, `EXPIRED`, `ACTIVE`, `COMPLETED`, and `CANCELLED`
- [x] 1.2 Add order-owned booking period fields and persistence mapping so orders store their rental window directly
- [x] 1.3 Update the order domain transition rules to remove sourcing states and enforce the new review-aware lifecycle

## 2. Booking Creation Flow

- [x] 2.1 Update order creation to load tenant booking mode and choose `CONFIRMED` for `instant-book` or `PENDING_REVIEW` for `request-to-book`
- [x] 2.2 Keep assignment creation transactional for both booking modes while persisting the order-owned booking period
- [x] 2.3 Add command-side tests for booking creation covering both booking modes and invalid lifecycle assumptions

## 3. Operator Lifecycle Actions

- [x] 3.1 Add confirm and reject pending-review booking commands, services, controllers, and transition validation
- [x] 3.2 Add cancel confirmed booking command, service, controller, and transition validation
- [x] 3.3 Add activate and complete booking commands, services, controllers, and transition validation
- [x] 3.4 Add expiry transition support at the domain and application layers so pending-review orders can move to `EXPIRED`

## 4. Read Models And Operator Views

- [x] 4.1 Update order detail reads to return status and booked period from order-owned data rather than requiring assignment-derived period
- [x] 4.2 Update general schedule and calendar queries to explicitly include only active operational statuses and exclude `PENDING_REVIEW`
- [x] 4.3 Add a dedicated operator-facing pending review query/view that lists `PENDING_REVIEW` orders

## 5. Migration And Verification

- [x] 5.1 Add a data migration strategy that remaps persisted sourcing statuses into the new lifecycle before rollout
- [x] 5.2 Add tests for valid and invalid lifecycle transitions, including confirm, reject, cancel, activate, complete, and expire flows
- [x] 5.3 Add query/read tests covering pending review visibility, operational view exclusions, and expired or rejected order readability
