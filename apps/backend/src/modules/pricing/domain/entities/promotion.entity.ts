import { randomUUID } from 'crypto';
import {
  PromotionActivationType,
  PromotionApplicability,
  PromotionApplicabilityTarget,
  PromotionCondition,
  PromotionEffect,
  PromotionStackingType,
} from '../types/promotion.types';
import { PricingTargetContext } from '../types/pricing-adjustment.types';

export interface CreatePromotionProps {
  tenantId: string;
  name: string;
  activationType: PromotionActivationType;
  priority: number;
  stackingType: PromotionStackingType;
  validFrom?: Date;
  validUntil?: Date;
  conditions: PromotionCondition[];
  applicability: PromotionApplicability;
  effect: PromotionEffect;
}

export interface ReconstitutePromotionProps {
  id: string;
  tenantId: string;
  name: string;
  activationType: PromotionActivationType;
  priority: number;
  stackingType: PromotionStackingType;
  validFrom: Date | null;
  validUntil: Date | null;
  isActive: boolean;
  conditions: PromotionCondition[];
  applicability: PromotionApplicability;
  effect: PromotionEffect;
}

export interface UpdatePromotionProps {
  name: string;
  activationType: PromotionActivationType;
  priority: number;
  stackingType: PromotionStackingType;
  validFrom?: Date;
  validUntil?: Date;
  conditions: PromotionCondition[];
  applicability: PromotionApplicability;
  effect: PromotionEffect;
}

export class Promotion {
  private constructor(
    public readonly id: string,
    public readonly tenantId: string,
    private _name: string,
    private _activationType: PromotionActivationType,
    private _priority: number,
    private _stackingType: PromotionStackingType,
    private _validFrom: Date | null,
    private _validUntil: Date | null,
    private _isActive: boolean,
    private _conditions: PromotionCondition[],
    private _applicability: PromotionApplicability,
    private _effect: PromotionEffect,
  ) {}

  static create(props: CreatePromotionProps): Promotion {
    assertValidWindow(props.validFrom, props.validUntil);
    assertValidPriority(props.priority);

    return new Promotion(
      randomUUID(),
      props.tenantId,
      props.name,
      props.activationType,
      props.priority,
      props.stackingType,
      props.validFrom ?? null,
      props.validUntil ?? null,
      true,
      [...props.conditions],
      normalizeApplicability(props.applicability),
      props.effect,
    );
  }

  static reconstitute(props: ReconstitutePromotionProps): Promotion {
    return new Promotion(
      props.id,
      props.tenantId,
      props.name,
      props.activationType,
      props.priority,
      props.stackingType,
      props.validFrom,
      props.validUntil,
      props.isActive,
      [...props.conditions],
      normalizeApplicability(props.applicability),
      props.effect,
    );
  }

  get name(): string {
    return this._name;
  }

  get activationType(): PromotionActivationType {
    return this._activationType;
  }

  get priority(): number {
    return this._priority;
  }

  get stackingType(): PromotionStackingType {
    return this._stackingType;
  }

  get validFrom(): Date | null {
    return this._validFrom;
  }

  get validUntil(): Date | null {
    return this._validUntil;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get conditions(): PromotionCondition[] {
    return [...this._conditions];
  }

  get applicability(): PromotionApplicability {
    return this._applicability;
  }

  get effect(): PromotionEffect {
    return this._effect;
  }

  update(props: UpdatePromotionProps): void {
    assertValidWindow(props.validFrom, props.validUntil);
    assertValidPriority(props.priority);

    this._name = props.name;
    this._activationType = props.activationType;
    this._priority = props.priority;
    this._stackingType = props.stackingType;
    this._validFrom = props.validFrom ?? null;
    this._validUntil = props.validUntil ?? null;
    this._conditions = [...props.conditions];
    this._applicability = normalizeApplicability(props.applicability);
    this._effect = props.effect;
  }

  activate(): void {
    this._isActive = true;
  }

  deactivate(): void {
    this._isActive = false;
  }

  isAvailableAt(now: Date): boolean {
    if (!this._isActive) {
      return false;
    }

    if (this._validFrom && now < this._validFrom) {
      return false;
    }

    if (this._validUntil && now > this._validUntil) {
      return false;
    }

    return true;
  }

  appliesToTarget(context: PricingTargetContext): boolean {
    if (context.productTypeId) {
      return (
        this._applicability.appliesTo.includes(PromotionApplicabilityTarget.PRODUCT) &&
        !this._applicability.excludedProductTypeIds.includes(context.productTypeId)
      );
    }

    if (context.bundleId) {
      return (
        this._applicability.appliesTo.includes(PromotionApplicabilityTarget.BUNDLE) &&
        !this._applicability.excludedBundleIds.includes(context.bundleId)
      );
    }

    return false;
  }
}

function normalizeApplicability(applicability: PromotionApplicability): PromotionApplicability {
  return {
    appliesTo: [...new Set(applicability.appliesTo)],
    excludedProductTypeIds: applicability.excludedProductTypeIds ?? [],
    excludedBundleIds: applicability.excludedBundleIds ?? [],
  };
}

function assertValidPriority(priority: number): void {
  if (priority < 0) {
    throw new Error('Promotion priority cannot be negative.');
  }
}

function assertValidWindow(validFrom?: Date | null, validUntil?: Date | null): void {
  if (validFrom && validUntil && validFrom >= validUntil) {
    throw new Error('Promotion validity window is invalid.');
  }
}
