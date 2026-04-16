import { Coupon as PrismaCoupon } from 'src/generated/prisma/client';
import { Coupon } from '../../../domain/entities/coupon.entity';

export class CouponMapper {
  static toDomain(raw: PrismaCoupon): Coupon {
    return Coupon.reconstitute({
      id: raw.id,
      tenantId: raw.tenantId,
      promotionId: raw.pricingRuleId,
      code: raw.code,
      maxUses: raw.maxUses,
      maxUsesPerCustomer: raw.maxUsesPerCustomer,
      restrictedToCustomerId: raw.restrictedToCustomerId,
      validFrom: raw.validFrom,
      validUntil: raw.validUntil,
      isActive: raw.isActive,
    });
  }

  static toPersistence(coupon: Coupon) {
    return {
      id: coupon.id,
      tenantId: coupon.tenantId,
      // Transitional persistence mapping: the legacy column now stores promotion ids.
      pricingRuleId: coupon.promotionId,
      code: coupon.code,
      maxUses: coupon.maxUses,
      maxUsesPerCustomer: coupon.maxUsesPerCustomer,
      restrictedToCustomerId: coupon.restrictedToCustomerId,
      validFrom: coupon.validFrom,
      validUntil: coupon.validUntil,
      isActive: coupon.isActive,
    };
  }
}
