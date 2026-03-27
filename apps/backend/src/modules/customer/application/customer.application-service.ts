import { Injectable } from '@nestjs/common';
import { CustomerPublicApi, RegisterCustomerPublicInput } from '../customer.public-api';
import { Customer } from '../domain/entities/customer.entity';
import { CustomerRepository } from '../infrastructure/repositories/customer.repository';

@Injectable()
export class CustomerApplicationService implements CustomerPublicApi {
  constructor(private readonly customerRepo: CustomerRepository) {}

  async register(input: RegisterCustomerPublicInput): Promise<string> {
    const customer = Customer.create({
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      passwordHash: input.passwordHash,
      isCompany: input.isCompany,
      companyName: input.companyName,
      tenantId: input.tenantId,
    });

    const customerId = await this.customerRepo.save(customer);

    return customerId;
  }
}
