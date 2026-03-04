import { Customer } from 'src/modules/customer/domain/entities/customer.entity';

export abstract class CustomerRepositoryPort {
  abstract save(data: Customer): Promise<string>;
}

export abstract class CustomerReadService {
  abstract getCustomer(customerId: string): Promise<Customer | null>;
}
