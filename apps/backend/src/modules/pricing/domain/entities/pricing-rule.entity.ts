import { randomUUID } from 'crypto';
import { PricingRuleCondition, PricingRuleEffect, RuleApplicationContext } from '../types/pricing-rule.types';
import { InvalidPricingRulePriorityException } from '../exceptions/pricing-rule.exceptions';

export enum PricingRuleType {
  SEASONAL = 'SEASONAL',
  VOLUME = 'VOLUME',
  COUPON = 'COUPON',
  CUSTOMER_SPECIFIC = 'CUSTOMER_SPECIFIC',
  DURATION = 'DURATION',
}

export enum PricingRuleScope {
  ORDER = 'ORDER',
  PRODUCT_TYPE = 'PRODUCT_TYPE',
  CATEGORY = 'CATEGORY',
  BUNDLE = 'BUNDLE',
}

export interface CreatePricingRuleProps {
  tenantId: string;
  name: string;
  type: PricingRuleType;
  scope: PricingRuleScope;
  priority: number;
  stackable: boolean;
  condition: PricingRuleCondition;
  effect: PricingRuleEffect;
}

export interface ReconstitutePricingRuleProps {
  id: string;
  tenantId: string;
  name: string;
  type: PricingRuleType;
  scope: PricingRuleScope;
  priority: number;
  stackable: boolean;
  isActive: boolean;
  condition: PricingRuleCondition;
  effect: PricingRuleEffect;
}

export class PricingRule {
  private constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly name: string,
    public readonly type: PricingRuleType,
    public readonly scope: PricingRuleScope,
    public readonly priority: number,
    public readonly stackable: boolean,
    private isActive: boolean,
    public readonly condition: PricingRuleCondition,
    public readonly effect: PricingRuleEffect,
  ) {}

  static create(props: CreatePricingRuleProps): PricingRule {
    if (props.priority < 0) {
      throw new InvalidPricingRulePriorityException();
    }
    return new PricingRule(
      randomUUID(),
      props.tenantId,
      props.name,
      props.type,
      props.scope,
      props.priority,
      props.stackable,
      true,
      props.condition,
      props.effect,
    );
  }

  static reconstitute(props: ReconstitutePricingRuleProps): PricingRule {
    return new PricingRule(
      props.id,
      props.tenantId,
      props.name,
      props.type,
      props.scope,
      props.priority,
      props.stackable,
      props.isActive,
      props.condition,
      props.effect,
    );
  }

  get active(): boolean {
    return this.isActive;
  }

  activate(): void {
    this.isActive = true;
  }

  deactivate(): void {
    this.isActive = false;
  }

  /**
   * Evaluates whether this rule applies to the given order item context.
   *
   * Each rule type checks its own condition shape. The discriminated union on
   * PricingRuleCondition ensures TypeScript narrows correctly in each branch.
   *
   * COUPON and CUSTOMER_SPECIFIC are not yet active in the MVP but are
   * stubbed here so the calculator doesn't need to change when they ship.
   */
  isApplicableTo(context: RuleApplicationContext): boolean {
    if (!this.isActive) {
      return false;
    }

    const condition = this.condition;

    switch (condition.type) {
      case PricingRuleType.SEASONAL: {
        const from = new Date(condition.dateFrom);
        const to = new Date(condition.dateTo);
        // Rule applies if the rental starts within the seasonal window.
        // A rental starting inside but ending outside still qualifies.
        return context.period.start >= from && context.period.start <= to;
      }

      case PricingRuleType.VOLUME: {
        const count = context.orderItemCountByCategory[condition.categoryId] ?? 0;
        return count >= condition.threshold;
      }

      case PricingRuleType.COUPON: {
        // The application layer validates the coupon and injects the rule ID
        // into context before the calculator runs. The domain trusts that
        // pre-validation — it only checks presence in the injected list.
        return context.applicableCouponRuleIds?.includes(this.id) ?? false;
      }

      case PricingRuleType.CUSTOMER_SPECIFIC: {
        return context.customerId === condition.customerId;
      }

      case PricingRuleType.DURATION: {
        return true;
      }
    }

    return false;
  }
}
