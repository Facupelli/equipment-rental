/**
 * How to handle remaining partial time for daily rentals.
 *
 * IGNORE_PARTIAL_UNIT        → bill only completed 24h units, while still
 *                              enforcing a minimum of one billed day for any
 *                              non-zero daily rental.
 * BILL_PARTIAL_AS_FULL_UNIT → bill any remaining partial time as one
 *                              additional day.
 */
export enum RoundingRule {
  IGNORE_PARTIAL_UNIT = "IGNORE_PARTIAL_UNIT",
  BILL_PARTIAL_AS_FULL_UNIT = "BILL_PARTIAL_AS_FULL_UNIT",
}
