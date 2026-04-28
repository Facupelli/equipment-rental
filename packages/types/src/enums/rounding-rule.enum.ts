/**
 * How to handle remaining partial time for daily rentals.
 *
 * IGNORE_PARTIAL_DAY   → bill only completed 24h units, while still
 *                        enforcing a minimum of one billed day for any
 *                        non-zero daily rental.
 * BILL_OVER_HALF_DAY   → bill the next daily unit only after crossing
 *                        half of the next 24h block.
 * BILL_ANY_PARTIAL_DAY → bill any remaining partial time as one
 *                        additional day.
 */
export enum RoundingRule {
  IGNORE_PARTIAL_DAY = "IGNORE_PARTIAL_DAY",
  BILL_OVER_HALF_DAY = "BILL_OVER_HALF_DAY",
  BILL_ANY_PARTIAL_DAY = "BILL_ANY_PARTIAL_DAY",
}
