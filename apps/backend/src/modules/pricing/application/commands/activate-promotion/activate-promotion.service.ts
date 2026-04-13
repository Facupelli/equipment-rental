import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Result, err, ok } from 'neverthrow';
import { PromotionNotFoundError } from '../../../domain/errors/pricing.errors';
import { PromotionRepository } from '../../../infrastructure/repositories/promotion.repository';
import { ActivatePromotionCommand } from './activate-promotion.command';

type ActivatePromotionResult = Result<void, PromotionNotFoundError>;

@CommandHandler(ActivatePromotionCommand)
export class ActivatePromotionService implements ICommandHandler<ActivatePromotionCommand, ActivatePromotionResult> {
  constructor(private readonly repository: PromotionRepository) {}

  async execute(command: ActivatePromotionCommand): Promise<ActivatePromotionResult> {
    const promotion = await this.repository.load(command.promotionId);
    if (!promotion) {
      return err(new PromotionNotFoundError(command.promotionId));
    }

    promotion.activate();
    await this.repository.save(promotion);
    return ok(undefined);
  }
}
