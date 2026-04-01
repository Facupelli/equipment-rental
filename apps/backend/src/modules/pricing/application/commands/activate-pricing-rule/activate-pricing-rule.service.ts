import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Result, err, ok } from 'neverthrow';

import { PricingRuleNotFoundError } from '../../../domain/errors/pricing.errors';
import { PricingRuleRepository } from '../../../infrastructure/repositories/pricing-rule.repository';

import { ActivatePricingRuleCommand } from './activate-pricing-rule.command';

type ActivatePricingRuleResult = Result<void, PricingRuleNotFoundError>;

@CommandHandler(ActivatePricingRuleCommand)
export class ActivatePricingRuleService implements ICommandHandler<
  ActivatePricingRuleCommand,
  ActivatePricingRuleResult
> {
  constructor(private readonly pricingRuleRepository: PricingRuleRepository) {}

  async execute(command: ActivatePricingRuleCommand): Promise<ActivatePricingRuleResult> {
    const rule = await this.pricingRuleRepository.load(command.pricingRuleId);
    if (!rule) {
      return err(new PricingRuleNotFoundError(command.pricingRuleId));
    }

    rule.activate();
    await this.pricingRuleRepository.save(rule);

    return ok(undefined);
  }
}
