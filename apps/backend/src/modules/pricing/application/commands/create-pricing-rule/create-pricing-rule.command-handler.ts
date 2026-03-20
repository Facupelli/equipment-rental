import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PricingRule } from '../../../domain/entities/pricing-rule.entity';
import { PricingRuleRepositoryPort } from '../../../domain/ports/pricing-rule.repository.port';
import { CreatePricingRuleCommand } from './create-pricing-rule.command';

@CommandHandler(CreatePricingRuleCommand)
export class CreatePricingRuleCommandHandler implements ICommandHandler<CreatePricingRuleCommand, string> {
  constructor(private readonly pricingRuleRepository: PricingRuleRepositoryPort) {}

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
