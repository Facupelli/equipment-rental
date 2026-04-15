import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { err, ok, Result } from 'neverthrow';
import { SubmitCustomerProfileCommand } from './submit-customer-profile.command';
import { CustomerRepository } from '../../../infrastructure/repositories/customer.repository';
import { CustomerProfileLeadSource } from '../../../domain/entities/customer-profile.entity';
import {
  CustomerNotFoundError,
  CustomerProfileAlreadyExistsError,
} from 'src/modules/customer/domain/errors/customer.errors';

@CommandHandler(SubmitCustomerProfileCommand)
export class SubmitCustomerProfileService implements ICommandHandler<SubmitCustomerProfileCommand> {
  constructor(private readonly customerRepo: CustomerRepository) {}

  async execute(
    command: SubmitCustomerProfileCommand,
  ): Promise<Result<void, CustomerNotFoundError | CustomerProfileAlreadyExistsError>> {
    const customer = await this.customerRepo.load(command.customerId);

    if (!customer) {
      return err(new CustomerNotFoundError());
    }

    const submitProfileResult = customer.submitProfile({
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
      instagram: command.instagram,
      knowsExistingCustomer: command.knowsExistingCustomer,
      knownCustomerName: command.knownCustomerName,
      heardAboutUs: command.heardAboutUs as CustomerProfileLeadSource,
      heardAboutUsOther: command.heardAboutUsOther,
      contact1Name: command.contact1Name,
      contact1Phone: command.contact1Phone,
      contact1Relationship: command.contact1Relationship,
      contact2Name: command.contact2Name,
      contact2Phone: command.contact2Phone,
      contact2Relationship: command.contact2Relationship,
    });

    if (submitProfileResult.isErr()) {
      return err(submitProfileResult.error);
    }

    await this.customerRepo.save(customer);

    return ok(undefined);
  }
}
