-- Coupons now belong to promotions directly.
ALTER TABLE "coupons" DROP CONSTRAINT IF EXISTS "coupons_pricing_rule_id_fkey";

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'coupons' AND column_name = 'pricing_rule_id'
  ) THEN
    ALTER TABLE "coupons" RENAME COLUMN "pricing_rule_id" TO "promotion_id";
  END IF;
END $$;

ALTER TABLE "coupons"
ADD CONSTRAINT "coupons_promotion_id_fkey"
FOREIGN KEY ("promotion_id") REFERENCES "promotions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

DROP TABLE IF EXISTS "pricing_rules";

DROP TYPE IF EXISTS "PricingRuleType";
DROP TYPE IF EXISTS "PricingRuleScope";
