import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PricingRule } from '../../../domain/entities/pricing-rule.entity';
import { PricingRuleRepository } from '../../../infrastructure/repositories/pricing-rule.repository';
import { CreatePricingRuleCommand } from './create-pricing-rule.command';

@CommandHandler(CreatePricingRuleCommand)
export class CreatePricingRuleService implements ICommandHandler<CreatePricingRuleCommand, string> {
  constructor(private readonly pricingRuleRepository: PricingRuleRepository) {}

  async execute(command: CreatePricingRuleCommand): Promise<string> {
    const rule = PricingRule.create({
      tenantId: command.tenantId,
      name: command.name,
      type: command.type,
      scope: command.scope,
      priority: command.priority,
      stackable: command.stackable,
      condition: command.condition,
      effect: command.effect,
    });

    return this.pricingRuleRepository.save(rule);
  }
}
