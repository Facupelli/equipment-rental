import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Result, err, ok } from 'neverthrow';
import { PromotionNotFoundError } from '../../../domain/errors/pricing.errors';
import { PromotionRepository } from '../../../infrastructure/repositories/promotion.repository';
import { DeletePromotionCommand } from './delete-promotion.command';

type DeletePromotionResult = Result<void, PromotionNotFoundError>;

@CommandHandler(DeletePromotionCommand)
export class DeletePromotionService implements ICommandHandler<DeletePromotionCommand, DeletePromotionResult> {
  constructor(private readonly repository: PromotionRepository) {}

  async execute(command: DeletePromotionCommand): Promise<DeletePromotionResult> {
    const promotion = await this.repository.load(command.promotionId);
    if (!promotion) {
      return err(new PromotionNotFoundError(command.promotionId));
    }

    await this.repository.delete(command.promotionId);
    return ok(undefined);
  }
}
