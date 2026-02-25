import { Injectable } from '@nestjs/common';
import { Customer } from './customer.entity';
import { CustomerRepository } from './ports/customer-service.repository';

@Injectable()
export class CustomerService {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async create(data: Customer): Promise<string> {
    return await this.customerRepository.save(data);
  }
}
