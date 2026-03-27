import { DomainException } from 'src/core/exceptions/domain.exception';

export class InvalidCustomerNameException extends DomainException {
  constructor(part: 'first' | 'last') {
    super(`Customer ${part} name cannot be empty.`);
  }
}

export class CompanyNameRequiredException extends DomainException {
  constructor() {
    super('Company name is required when customer is a company.');
  }
}
