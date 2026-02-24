import { Customer } from 'src/modules/customer/customer.entity';

export abstract class RentalCustomerQueryPort {
  abstract findById(id: string): Promise<Customer | null>;
}
