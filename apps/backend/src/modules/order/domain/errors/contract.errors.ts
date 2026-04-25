import { DomainError } from 'src/core/exceptions/domain.error';
import { OrderStatus } from '@repo/types';

export class ContractCustomerProfileMissingError extends DomainError {
  constructor(customerId: string) {
    super(`Customer "${customerId}" has no approved profile. A document number is required to generate a contract.`);
  }
}

export class OrderBudgetMustBeDraftError extends DomainError {
  constructor(orderId: string, status: OrderStatus) {
    super(`Order "${orderId}" is in status "${status}". A presupuesto can only be generated for draft orders.`);
  }
}
