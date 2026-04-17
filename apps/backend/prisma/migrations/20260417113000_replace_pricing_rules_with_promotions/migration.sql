-- Coupons now belong to promotions directly.
ALTER TABLE "coupons" DROP CONSTRAINT IF EXISTS "coupons_pricing_rule_id_fkey";

ALTER TABLE "coupons" RENAME COLUMN "pricing_rule_id" TO "promotion_id";

ALTER TABLE "coupons"
ADD CONSTRAINT "coupons_promotion_id_fkey"
FOREIGN KEY ("promotion_id") REFERENCES "promotions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

DROP TABLE "pricing_rules";

DROP TYPE "PricingRuleType";
DROP TYPE "PricingRuleScope";
