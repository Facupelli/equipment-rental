import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LongRentalDiscount } from '../../../domain/entities/long-rental-discount.entity';
import { LongRentalDiscountRepository } from '../../../infrastructure/repositories/long-rental-discount.repository';
import { CreateLongRentalDiscountCommand } from './create-long-rental-discount.command';

@CommandHandler(CreateLongRentalDiscountCommand)
export class CreateLongRentalDiscountService implements ICommandHandler<CreateLongRentalDiscountCommand, string> {
  constructor(private readonly repository: LongRentalDiscountRepository) {}

  async execute(command: CreateLongRentalDiscountCommand): Promise<string> {
    const discount = LongRentalDiscount.create({
      tenantId: command.tenantId,
      name: command.name,
      priority: command.priority,
      tiers: command.tiers,
      target: command.target,
    });

    return this.repository.save(discount);
  }
}
