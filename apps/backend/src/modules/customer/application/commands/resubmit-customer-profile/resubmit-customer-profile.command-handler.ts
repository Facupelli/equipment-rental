import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ResubmitCustomerProfileCommand } from './resubmit-customer-profile.command';
import { CustomerRepositoryPort } from '../../ports/customer.repository.port';
import { err, ok, Result } from 'src/core/result';
import {
  CannotSubmitApprovedProfileException,
  CustomerNotFoundException,
  CustomerProfileNotFoundException,
} from 'src/modules/customer/domain/exceptions/customer.exceptions';
import { ConflictException } from '@nestjs/common';

@CommandHandler(ResubmitCustomerProfileCommand)
export class ResubmitCustomerProfileCommandHandler implements ICommandHandler<ResubmitCustomerProfileCommand> {
  constructor(private readonly customerRepo: CustomerRepositoryPort) {}

  async execute(
    command: ResubmitCustomerProfileCommand,
  ): Promise<Result<void, CustomerNotFoundException | CustomerProfileNotFoundException>> {
    const customer = await this.customerRepo.load(command.customerId);

    if (!customer) {
      return err(new CustomerNotFoundException());
    }

    try {
      customer.resubmitProfile({
        customerId: command.customerId,
        fullName: command.fullName,
        phone: command.phone,
        birthDate: new Date(command.birthDate),
        documentNumber: command.documentNumber,
        identityDocumentPath: command.identityDocumentPath,
        address: command.address,
        city: command.city,
        stateRegion: command.stateRegion,
        country: command.country,
        occupation: command.occupation,
        company: command.company,
        taxId: command.taxId,
        businessName: command.businessName,
        bankName: command.bankName,
        accountNumber: command.accountNumber,
        contact1Name: command.contact1Name,
        contact1Relationship: command.contact1Relationship,
        contact2Name: command.contact2Name,
        contact2Relationship: command.contact2Relationship,
      });
    } catch (e) {
      if (e instanceof CustomerProfileNotFoundException) {
        return err(new CustomerNotFoundException());
      }
      if (e instanceof CannotSubmitApprovedProfileException) {
        throw new ConflictException(e.message);
      }
      throw e;
    }

    await this.customerRepo.save(customer);

    return ok(undefined);
  }
}
