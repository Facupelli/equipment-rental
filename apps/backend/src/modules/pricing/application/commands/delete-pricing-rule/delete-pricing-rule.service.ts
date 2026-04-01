import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Result, err, ok } from 'neverthrow';
import { PrismaService } from 'src/core/database/prisma.service';

import { PricingRuleHasCouponsError, PricingRuleNotFoundError } from '../../../domain/errors/pricing.errors';
import { PricingRuleRepository } from '../../../infrastructure/repositories/pricing-rule.repository';

import { DeletePricingRuleCommand } from './delete-pricing-rule.command';

type DeletePricingRuleResult = Result<void, PricingRuleNotFoundError | PricingRuleHasCouponsError>;

@CommandHandler(DeletePricingRuleCommand)
export class DeletePricingRuleService implements ICommandHandler<DeletePricingRuleCommand, DeletePricingRuleResult> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingRuleRepository: PricingRuleRepository,
  ) {}

  async execute(command: DeletePricingRuleCommand): Promise<DeletePricingRuleResult> {
    const rule = await this.pricingRuleRepository.load(command.pricingRuleId);
    if (!rule) {
      return err(new PricingRuleNotFoundError(command.pricingRuleId));
    }

    const couponCount = await this.prisma.client.coupon.count({
      where: {
        pricingRuleId: command.pricingRuleId,
      },
    });

    if (couponCount > 0) {
      return err(new PricingRuleHasCouponsError(command.pricingRuleId));
    }

    await this.prisma.client.pricingRule.delete({ where: { id: command.pricingRuleId } });

    return ok(undefined);
  }
}
