import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Result, err, ok } from 'neverthrow';

import { PricingRuleNotFoundError } from '../../../domain/errors/pricing.errors';
import { PricingRuleRepository } from '../../../infrastructure/repositories/pricing-rule.repository';

import { DeactivatePricingRuleCommand } from './deactivate-pricing-rule.command';

type DeactivatePricingRuleResult = Result<void, PricingRuleNotFoundError>;

@CommandHandler(DeactivatePricingRuleCommand)
export class DeactivatePricingRuleService implements ICommandHandler<
  DeactivatePricingRuleCommand,
  DeactivatePricingRuleResult
> {
  constructor(private readonly pricingRuleRepository: PricingRuleRepository) {}

  async execute(command: DeactivatePricingRuleCommand): Promise<DeactivatePricingRuleResult> {
    const rule = await this.pricingRuleRepository.load(command.pricingRuleId);
    if (!rule) {
      return err(new PricingRuleNotFoundError(command.pricingRuleId));
    }

    rule.deactivate();
    await this.pricingRuleRepository.save(rule);

    return ok(undefined);
  }
}
