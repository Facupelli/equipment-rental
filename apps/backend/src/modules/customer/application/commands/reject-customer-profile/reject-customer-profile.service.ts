import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { err, ok, Result } from 'neverthrow';
import {
  CannotReviewNonPendingProfileError,
  CustomerProfileNotFoundError,
  RejectionReasonRequiredError,
} from 'src/modules/customer/domain/errors/customer.errors';
import { CustomerRepository } from '../../../infrastructure/repositories/customer.repository';
import { RejectCustomerProfileCommand } from './reject-customer-profile.command';

@CommandHandler(RejectCustomerProfileCommand)
export class RejectCustomerProfileService implements ICommandHandler<RejectCustomerProfileCommand> {
  constructor(private readonly customerRepo: CustomerRepository) {}

  async execute(
    command: RejectCustomerProfileCommand,
  ): Promise<
    Result<void, CustomerProfileNotFoundError | CannotReviewNonPendingProfileError | RejectionReasonRequiredError>
  > {
    const customer = await this.customerRepo.loadByProfileId(command.customerProfileId, command.tenantId);

    if (!customer) {
      return err(new CustomerProfileNotFoundError());
    }

    const rejectResult = customer.rejectProfile(command.reviewedById, command.reason);
    if (rejectResult.isErr()) {
      return err(rejectResult.error);
    }

    await this.customerRepo.save(customer);

    return ok(undefined);
  }
}
