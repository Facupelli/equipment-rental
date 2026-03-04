import { Injectable } from '@nestjs/common';
import { CustomerRepositoryPort } from './application/ports/customer.repository.port';
import { CreateCustomerDto } from './application/dto/create-customer.dto';
import { Customer } from './domain/entities/customer.entity';

@Injectable()
export class CustomerService {
  constructor(private readonly customerRepository: CustomerRepositoryPort) {}

  async create(data: CreateCustomerDto): Promise<string> {
    const customer = Customer.create(data);

    return await this.customerRepository.save(customer);
  }
}
