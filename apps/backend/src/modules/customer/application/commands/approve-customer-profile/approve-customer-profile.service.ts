import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { err, ok, Result } from 'neverthrow';
import {
  CannotReviewNonPendingProfileError,
  CustomerProfileNotFoundError,
} from 'src/modules/customer/domain/errors/customer.errors';
import { CustomerRepository } from '../../../infrastructure/repositories/customer.repository';
import { ApproveCustomerProfileCommand } from './approve-customer-profile.command';

@CommandHandler(ApproveCustomerProfileCommand)
export class ApproveCustomerProfileService implements ICommandHandler<ApproveCustomerProfileCommand> {
  constructor(private readonly customerRepo: CustomerRepository) {}

  async execute(
    command: ApproveCustomerProfileCommand,
  ): Promise<Result<void, CustomerProfileNotFoundError | CannotReviewNonPendingProfileError>> {
    const customer = await this.customerRepo.loadByProfileId(command.customerProfileId, command.tenantId);

    if (!customer) {
      return err(new CustomerProfileNotFoundError());
    }

    const approveResult = customer.approveProfile(command.reviewedById);
    if (approveResult.isErr()) {
      return err(approveResult.error);
    }

    await this.customerRepo.save(customer);

    return ok(undefined);
  }
}
