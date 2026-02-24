/**
 * Represents the lifecycle state of a customer.
 *
 * ACTIVE        — Normal state. Customer can create bookings.
 * SUSPENDED     — Temporarily blocked, e.g. pending resolution of an unpaid invoice.
 *                 Can be reinstated. Cannot create bookings.
 * BLACKLISTED   — Permanent ban. Cannot create bookings.
 * PENDING_KYC   — Onboarded but identity not yet verified.
 *                 Booking restrictions may apply depending on tenant config.
 *                 TODO: enforce KYC-based booking rules in CreateBookingHandler.
 * INACTIVE      — Soft-deleted or churned. No longer active on the platform.
 */
export enum CustomerStatus {
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
  BLACKLISTED = "BLACKLISTED",
  PENDING_KYC = "PENDING_KYC",
  INACTIVE = "INACTIVE",
}
