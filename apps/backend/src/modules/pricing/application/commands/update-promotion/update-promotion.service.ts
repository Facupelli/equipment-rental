import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Result, err, ok } from 'neverthrow';
import { PromotionNotFoundError } from '../../../domain/errors/pricing.errors';
import { PromotionRepository } from '../../../infrastructure/repositories/promotion.repository';
import { UpdatePromotionCommand } from './update-promotion.command';

type UpdatePromotionResult = Result<void, PromotionNotFoundError>;

@CommandHandler(UpdatePromotionCommand)
export class UpdatePromotionService implements ICommandHandler<UpdatePromotionCommand, UpdatePromotionResult> {
  constructor(private readonly repository: PromotionRepository) {}

  async execute(command: UpdatePromotionCommand): Promise<UpdatePromotionResult> {
    const promotion = await this.repository.load(command.promotionId);
    if (!promotion) {
      return err(new PromotionNotFoundError(command.promotionId));
    }

    promotion.update({
      name: command.name,
      type: command.type,
      priority: command.priority,
      stackable: command.stackable,
      condition: command.condition,
      effect: command.effect,
      target: command.target,
    });

    await this.repository.save(promotion);
    return ok(undefined);
  }
}
