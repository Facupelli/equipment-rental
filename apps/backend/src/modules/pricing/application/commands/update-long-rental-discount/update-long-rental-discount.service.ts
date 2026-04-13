import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Result, err, ok } from 'neverthrow';
import { LongRentalDiscountNotFoundError } from '../../../domain/errors/pricing.errors';
import { LongRentalDiscountRepository } from '../../../infrastructure/repositories/long-rental-discount.repository';
import { UpdateLongRentalDiscountCommand } from './update-long-rental-discount.command';

type UpdateLongRentalDiscountResult = Result<void, LongRentalDiscountNotFoundError>;

@CommandHandler(UpdateLongRentalDiscountCommand)
export class UpdateLongRentalDiscountService implements ICommandHandler<
  UpdateLongRentalDiscountCommand,
  UpdateLongRentalDiscountResult
> {
  constructor(private readonly repository: LongRentalDiscountRepository) {}

  async execute(command: UpdateLongRentalDiscountCommand): Promise<UpdateLongRentalDiscountResult> {
    const discount = await this.repository.load(command.longRentalDiscountId);
    if (!discount) {
      return err(new LongRentalDiscountNotFoundError(command.longRentalDiscountId));
    }

    discount.update({
      name: command.name,
      priority: command.priority,
      tiers: command.tiers,
      target: command.target,
    });

    await this.repository.save(discount);
    return ok(undefined);
  }
}
