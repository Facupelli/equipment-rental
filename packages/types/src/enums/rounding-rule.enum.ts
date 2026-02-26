/**
 * How to handle a remainder that does not fill a complete billing unit.
 *
 * SPLIT    → decompose the remainder into the next smaller unit(s).
 *            e.g. 36h with [full_day=24h, half_day=12h] → 1 full_day + 1 half_day
 *
 * ROUND_UP → round the last partial unit up to one full unit of the same type.
 *            e.g. 30h with [full_day=24h, half_day=12h] → 2 full_days (6h remainder rounded up)
 */
export enum RoundingRule {
  SPLIT = "SPLIT",
  ROUND_UP = "ROUND_UP",
}
