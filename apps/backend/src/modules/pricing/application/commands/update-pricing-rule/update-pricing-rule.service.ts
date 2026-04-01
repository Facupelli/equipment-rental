import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Result, err, ok } from 'neverthrow';

import { PricingRuleNotFoundError } from '../../../domain/errors/pricing.errors';
import { PricingRuleRepository } from '../../../infrastructure/repositories/pricing-rule.repository';

import { UpdatePricingRuleCommand } from './update-pricing-rule.command';

type UpdatePricingRuleResult = Result<void, PricingRuleNotFoundError>;

@CommandHandler(UpdatePricingRuleCommand)
export class UpdatePricingRuleService implements ICommandHandler<UpdatePricingRuleCommand, UpdatePricingRuleResult> {
  constructor(private readonly pricingRuleRepository: PricingRuleRepository) {}

  async execute(command: UpdatePricingRuleCommand): Promise<UpdatePricingRuleResult> {
    const rule = await this.pricingRuleRepository.load(command.pricingRuleId);
    if (!rule) {
      return err(new PricingRuleNotFoundError(command.pricingRuleId));
    }

    rule.update({
      name: command.name,
      type: command.type,
      scope: command.scope,
      priority: command.priority,
      stackable: command.stackable,
      condition: command.condition,
      effect: command.effect,
    });

    await this.pricingRuleRepository.save(rule);

    return ok(undefined);
  }
}
