import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Result, err, ok } from 'neverthrow';
import { PromotionNotFoundError } from '../../../domain/errors/pricing.errors';
import { PromotionRepository } from '../../../infrastructure/repositories/promotion.repository';
import { DeactivatePromotionCommand } from './deactivate-promotion.command';

type DeactivatePromotionResult = Result<void, PromotionNotFoundError>;

@CommandHandler(DeactivatePromotionCommand)
export class DeactivatePromotionService implements ICommandHandler<
  DeactivatePromotionCommand,
  DeactivatePromotionResult
> {
  constructor(private readonly repository: PromotionRepository) {}

  async execute(command: DeactivatePromotionCommand): Promise<DeactivatePromotionResult> {
    const promotion = await this.repository.load(command.promotionId);
    if (!promotion) {
      return err(new PromotionNotFoundError(command.promotionId));
    }

    promotion.deactivate();
    await this.repository.save(promotion);
    return ok(undefined);
  }
}
