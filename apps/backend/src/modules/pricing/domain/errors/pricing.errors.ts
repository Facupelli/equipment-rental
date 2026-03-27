import { DomainError } from 'src/core/exceptions/domain.error';
import { CouponValidationFailureReason } from '../services/coupon-validation.service';

export class PricingError extends DomainError {}

export class CouponNotFoundError extends PricingError {
  constructor(codeOrId: string) {
    super(`Coupon "${codeOrId}" was not found.`);
  }
}

export class CouponValidationError extends PricingError {
  constructor(public readonly reason: CouponValidationFailureReason) {
    super(`Coupon validation failed: ${reason}`);
  }
}

export class CouponCodeAlreadyExistsError extends PricingError {
  constructor(code: string) {
    super(`Coupon with code "${code}" already exists for this tenant.`);
  }
}

export class PricingRuleNotFoundError extends PricingError {
  constructor(id: string) {
    super(`Pricing rule "${id}" was not found.`);
  }
}

export class PricingRuleNotCouponTypeError extends PricingError {
  constructor(id: string) {
    super(`Pricing rule "${id}" is not of type COUPON.`);
  }
}

export class PricingTargetNotFoundError extends PricingError {
  constructor(targetType: string, targetId: string) {
    super(`${targetType} with id ${targetId} was not found`);
  }
}

export class PricingTargetInactiveError extends PricingError {
  constructor(targetType: string, targetId: string) {
    super(`${targetType} with id ${targetId} is inactive and cannot be configured`);
  }
}

export class PricingPeriodInvalidError extends PricingError {
  constructor() {
    super('Rental period end must be after start.');
  }
}

export class PricingProductTypeNotFoundError extends PricingError {
  constructor(productTypeId: string) {
    super(`ProductType "${productTypeId}" was not found.`);
  }
}

export class PricingBundleNotFoundError extends PricingError {
  constructor(bundleId: string) {
    super(`Bundle "${bundleId}" was not found.`);
  }
}
