export enum BookingStatus {
  PENDING_CONFIRMATION = "PENDING_CONFIRMATION", // Over-rental: awaiting admin sourcing
  RESERVED = "RESERVED", // Stock confirmed, awaiting pickup
  ACTIVE = "ACTIVE", // Equipment is out with customer
  COMPLETED = "COMPLETED", // Equipment returned (terminal)
  CANCELLED = "CANCELLED", // Booking voided (terminal)
}
