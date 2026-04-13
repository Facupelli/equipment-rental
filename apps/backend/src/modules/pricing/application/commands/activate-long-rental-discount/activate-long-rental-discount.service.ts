import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Result, err, ok } from 'neverthrow';
import { LongRentalDiscountNotFoundError } from '../../../domain/errors/pricing.errors';
import { LongRentalDiscountRepository } from '../../../infrastructure/repositories/long-rental-discount.repository';
import { ActivateLongRentalDiscountCommand } from './activate-long-rental-discount.command';

type ActivateLongRentalDiscountResult = Result<void, LongRentalDiscountNotFoundError>;

@CommandHandler(ActivateLongRentalDiscountCommand)
export class ActivateLongRentalDiscountService implements ICommandHandler<
  ActivateLongRentalDiscountCommand,
  ActivateLongRentalDiscountResult
> {
  constructor(private readonly repository: LongRentalDiscountRepository) {}

  async execute(command: ActivateLongRentalDiscountCommand): Promise<ActivateLongRentalDiscountResult> {
    const discount = await this.repository.load(command.longRentalDiscountId);
    if (!discount) {
      return err(new LongRentalDiscountNotFoundError(command.longRentalDiscountId));
    }

    discount.activate();
    await this.repository.save(discount);
    return ok(undefined);
  }
}
