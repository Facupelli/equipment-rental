import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Result, err, ok } from 'neverthrow';
import { LongRentalDiscountNotFoundError } from '../../../domain/errors/pricing.errors';
import { LongRentalDiscountRepository } from '../../../infrastructure/repositories/long-rental-discount.repository';
import { DeactivateLongRentalDiscountCommand } from './deactivate-long-rental-discount.command';

type DeactivateLongRentalDiscountResult = Result<void, LongRentalDiscountNotFoundError>;

@CommandHandler(DeactivateLongRentalDiscountCommand)
export class DeactivateLongRentalDiscountService implements ICommandHandler<
  DeactivateLongRentalDiscountCommand,
  DeactivateLongRentalDiscountResult
> {
  constructor(private readonly repository: LongRentalDiscountRepository) {}

  async execute(command: DeactivateLongRentalDiscountCommand): Promise<DeactivateLongRentalDiscountResult> {
    const discount = await this.repository.load(command.longRentalDiscountId);
    if (!discount) {
      return err(new LongRentalDiscountNotFoundError(command.longRentalDiscountId));
    }

    discount.deactivate();
    await this.repository.save(discount);
    return ok(undefined);
  }
}
