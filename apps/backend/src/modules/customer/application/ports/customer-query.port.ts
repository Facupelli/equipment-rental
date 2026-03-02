import { Customer } from 'src/modules/customer/domain/customer.entity';

export abstract class CustomerQueryPort {
  abstract getCustomer(customerId: string): Promise<Customer | null>;
}
