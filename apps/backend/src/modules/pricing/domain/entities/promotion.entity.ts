import { randomUUID } from 'crypto';
import { PromotionCondition, PromotionEffect, PromotionTarget, PromotionType } from '../types/promotion.types';
import { PricingTargetContext } from '../types/pricing-adjustment.types';

export interface CreatePromotionProps {
  tenantId: string;
  name: string;
  type: PromotionType;
  priority: number;
  stackable: boolean;
  condition: PromotionCondition;
  effect: PromotionEffect;
  target?: Partial<PromotionTarget>;
}

export interface ReconstitutePromotionProps {
  id: string;
  tenantId: string;
  name: string;
  type: PromotionType;
  priority: number;
  stackable: boolean;
  isActive: boolean;
  condition: PromotionCondition;
  effect: PromotionEffect;
  target: PromotionTarget;
}

export interface UpdatePromotionProps {
  name: string;
  type: PromotionType;
  priority: number;
  stackable: boolean;
  condition: PromotionCondition;
  effect: PromotionEffect;
  target?: Partial<PromotionTarget>;
}

export class Promotion {
  private constructor(
    public readonly id: string,
    public readonly tenantId: string,
    private _name: string,
    private _type: PromotionType,
    private _priority: number,
    private _stackable: boolean,
    private _isActive: boolean,
    private _condition: PromotionCondition,
    private _effect: PromotionEffect,
    private _target: PromotionTarget,
  ) {}

  static create(props: CreatePromotionProps): Promotion {
    assertValidPriority(props.priority);
    assertConditionMatchesType(props.type, props.condition);

    return new Promotion(
      randomUUID(),
      props.tenantId,
      props.name,
      props.type,
      props.priority,
      props.stackable,
      true,
      props.condition,
      props.effect,
      normalizeTarget(props.target),
    );
  }

  static reconstitute(props: ReconstitutePromotionProps): Promotion {
    return new Promotion(
      props.id,
      props.tenantId,
      props.name,
      props.type,
      props.priority,
      props.stackable,
      props.isActive,
      props.condition,
      props.effect,
      normalizeTarget(props.target),
    );
  }

  get name(): string {
    return this._name;
  }

  get type(): PromotionType {
    return this._type;
  }

  get priority(): number {
    return this._priority;
  }

  get stackable(): boolean {
    return this._stackable;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get condition(): PromotionCondition {
    return this._condition;
  }

  get effect(): PromotionEffect {
    return this._effect;
  }

  get target(): PromotionTarget {
    return this._target;
  }

  update(props: UpdatePromotionProps): void {
    assertValidPriority(props.priority);
    assertConditionMatchesType(props.type, props.condition);

    this._name = props.name;
    this._type = props.type;
    this._priority = props.priority;
    this._stackable = props.stackable;
    this._condition = props.condition;
    this._effect = props.effect;
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

function normalizeTarget(target?: Partial<PromotionTarget>): PromotionTarget {
  return {
    excludedProductTypeIds: target?.excludedProductTypeIds ?? [],
    excludedBundleIds: target?.excludedBundleIds ?? [],
  };
}

function assertValidPriority(priority: number): void {
  if (priority < 0) {
    throw new Error('Promotion priority cannot be negative.');
  }
}

function assertConditionMatchesType(type: PromotionType, condition: PromotionCondition): void {
  if (condition.type !== type) {
    throw new Error(`Promotion condition type "${condition.type}" does not match promotion type "${type}".`);
  }
}
