import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Result, err, ok } from 'neverthrow';
import { LongRentalDiscountNotFoundError } from '../../../domain/errors/pricing.errors';
import { LongRentalDiscountRepository } from '../../../infrastructure/repositories/long-rental-discount.repository';
import { DeleteLongRentalDiscountCommand } from './delete-long-rental-discount.command';

type DeleteLongRentalDiscountResult = Result<void, LongRentalDiscountNotFoundError>;

@CommandHandler(DeleteLongRentalDiscountCommand)
export class DeleteLongRentalDiscountService implements ICommandHandler<
  DeleteLongRentalDiscountCommand,
  DeleteLongRentalDiscountResult
> {
  constructor(private readonly repository: LongRentalDiscountRepository) {}

  async execute(command: DeleteLongRentalDiscountCommand): Promise<DeleteLongRentalDiscountResult> {
    const discount = await this.repository.load(command.longRentalDiscountId);
    if (!discount) {
      return err(new LongRentalDiscountNotFoundError(command.longRentalDiscountId));
    }

    await this.repository.delete(command.longRentalDiscountId);
    return ok(undefined);
  }
}
