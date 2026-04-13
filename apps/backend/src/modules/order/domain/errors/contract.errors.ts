import { DomainError } from 'src/core/exceptions/domain.error';

export class ContractCustomerProfileMissingError extends DomainError {
  constructor(customerId: string) {
    super(`Customer "${customerId}" has no approved profile. A document number is required to generate a contract.`);
  }
}
