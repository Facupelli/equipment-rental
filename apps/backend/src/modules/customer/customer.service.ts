import { Injectable } from '@nestjs/common';
import { CustomerRepository } from './ports/customer.repository';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { Customer } from './customer.entity';

@Injectable()
export class CustomerService {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async create(data: CreateCustomerDto): Promise<string> {
    const customer = Customer.create({
      tenantId: data.tenantId,
      name: data.name,
      email: data.email,
      phone: data.phone ? data.phone : null,
    });

    return await this.customerRepository.save(customer);
  }
}
