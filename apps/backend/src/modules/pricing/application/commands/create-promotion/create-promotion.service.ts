import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Promotion } from '../../../domain/entities/promotion.entity';
import { PromotionRepository } from '../../../infrastructure/repositories/promotion.repository';
import { CreatePromotionCommand } from './create-promotion.command';

@CommandHandler(CreatePromotionCommand)
export class CreatePromotionService implements ICommandHandler<CreatePromotionCommand, string> {
  constructor(private readonly repository: PromotionRepository) {}

  async execute(command: CreatePromotionCommand): Promise<string> {
    const promotion = Promotion.create({
      tenantId: command.tenantId,
      name: command.name,
      type: command.type,
      priority: command.priority,
      stackable: command.stackable,
      condition: command.condition,
      effect: command.effect,
      target: command.target,
    });

    return this.repository.save(promotion);
  }
}
