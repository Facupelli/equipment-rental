import { Customer } from '../entities/customer.entity';

export abstract class CustomerRepositoryPort {
  abstract load(id: string): Promise<Customer | null>;
  abstract save(customer: Customer): Promise<string>;
}
