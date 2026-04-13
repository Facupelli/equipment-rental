import { randomUUID } from 'crypto';
import { LongRentalDiscountTarget, LongRentalDiscountTier } from '../types/long-rental-discount.types';
import { PricingTargetContext } from '../types/pricing-adjustment.types';

export interface CreateLongRentalDiscountProps {
  tenantId: string;
  name: string;
  priority: number;
  tiers: LongRentalDiscountTier[];
  target?: Partial<LongRentalDiscountTarget>;
}

export interface ReconstituteLongRentalDiscountProps {
  id: string;
  tenantId: string;
  name: string;
  priority: number;
  isActive: boolean;
  tiers: LongRentalDiscountTier[];
  target: LongRentalDiscountTarget;
}

export interface UpdateLongRentalDiscountProps {
  name: string;
  priority: number;
  tiers: LongRentalDiscountTier[];
  target?: Partial<LongRentalDiscountTarget>;
}

export class LongRentalDiscount {
  private constructor(
    public readonly id: string,
    public readonly tenantId: string,
    private _name: string,
    private _priority: number,
    private _isActive: boolean,
    private _tiers: LongRentalDiscountTier[],
    private _target: LongRentalDiscountTarget,
  ) {}

  static create(props: CreateLongRentalDiscountProps): LongRentalDiscount {
    assertValidPriority(props.priority);
    assertValidTiers(props.tiers);

    return new LongRentalDiscount(
      randomUUID(),
      props.tenantId,
      props.name,
      props.priority,
      true,
      props.tiers,
      normalizeTarget(props.target),
    );
  }

  static reconstitute(props: ReconstituteLongRentalDiscountProps): LongRentalDiscount {
    return new LongRentalDiscount(
      props.id,
      props.tenantId,
      props.name,
      props.priority,
      props.isActive,
      props.tiers,
      normalizeTarget(props.target),
    );
  }

  get name(): string {
    return this._name;
  }

  get priority(): number {
    return this._priority;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get tiers(): LongRentalDiscountTier[] {
    return this._tiers;
  }

  get target(): LongRentalDiscountTarget {
    return this._target;
  }

  update(props: UpdateLongRentalDiscountProps): void {
    assertValidPriority(props.priority);
    assertValidTiers(props.tiers);

    this._name = props.name;
    this._priority = props.priority;
    this._tiers = props.tiers;
    this._target = normalizeTarget(props.target);
  }

  activate(): void {
    this._isActive = true;
  }

  deactivate(): void {
    this._isActive = false;
  }

  excludes(context: PricingTargetContext): boolean {
    if (context.productTypeId && this._target.excludedProductTypeIds.includes(context.productTypeId)) {
      return true;
    }

    if (context.bundleId && this._target.excludedBundleIds.includes(context.bundleId)) {
      return true;
    }

    return false;
  }
}

function normalizeTarget(target?: Partial<LongRentalDiscountTarget>): LongRentalDiscountTarget {
  return {
    excludedProductTypeIds: target?.excludedProductTypeIds ?? [],
    excludedBundleIds: target?.excludedBundleIds ?? [],
  };
}

function assertValidPriority(priority: number): void {
  if (priority < 0) {
    throw new Error('Long rental discount priority cannot be negative.');
  }
}

function assertValidTiers(tiers: LongRentalDiscountTier[]): void {
  if (tiers.length === 0) {
    throw new Error('Long rental discount must define at least one tier.');
  }

  for (let i = 0; i < tiers.length; i++) {
    const tier = tiers[i];

    if (tier.fromUnits < 1) {
      throw new Error('Long rental discount tiers must start at unit 1 or later.');
    }

    if (tier.toUnits !== null && tier.toUnits < tier.fromUnits) {
      throw new Error('Long rental discount tier upper bound must be greater than or equal to fromUnits.');
    }

    if (tier.discountPct < 0 || tier.discountPct > 100) {
      throw new Error('Long rental discount tier percentage must be between 0 and 100.');
    }

    if (i > 0) {
      const previous = tiers[i - 1];
      const previousEnd = previous.toUnits ?? Infinity;

      if (tier.fromUnits <= previousEnd) {
        throw new Error('Long rental discount tiers must not overlap.');
      }
    }
  }

  const lastTier = tiers[tiers.length - 1];
  if (lastTier.toUnits !== null) {
    throw new Error('Long rental discount last tier must be open-ended.');
  }
}
