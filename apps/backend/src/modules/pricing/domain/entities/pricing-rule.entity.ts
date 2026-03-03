import { randomUUID } from 'crypto';
import { PricingRuleCondition, PricingRuleEffect } from '../types/pricing-rule.types';
import { PricingRuleScope, PricingRuleType } from '../enums/pricing-rule.enum';
import { InvalidPricingRulePriorityException } from '../exceptions/pricing-rule.exceptions';

export interface CreatePricingRuleProps {
  tenantId: string;
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
}
