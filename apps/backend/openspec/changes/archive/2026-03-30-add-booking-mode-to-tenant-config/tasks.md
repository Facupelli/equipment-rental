## 1. Shared config contract

- [x] 1.1 Add `bookingMode` to the shared tenant config response and update schemas with `instant-book` as the default behavior.
- [x] 1.2 Update any frontend tenant config form/schema adapters that consume the shared tenant config contract.

## 2. Backend tenant config model

- [x] 2.1 Extend the tenant config value object, patch type, and defaults to support `bookingMode` with allowed-value validation.
- [x] 2.2 Update tenant persistence and mapping paths so missing legacy values normalize to `instant-book` on read and write.

## 3. Tenant config application flow

- [x] 3.1 Pass `bookingMode` through the existing tenant config update command and HTTP DTO flow.
- [x] 3.2 Expose `bookingMode` from the existing tenant config query/read models used by operators and downstream modules.

## 4. Verification

- [x] 4.1 Add backend tests for defaulting, invalid booking mode rejection, and legacy config normalization.
- [x] 4.2 Add or update consumer tests for shared schema parsing and tenant config form mapping.
