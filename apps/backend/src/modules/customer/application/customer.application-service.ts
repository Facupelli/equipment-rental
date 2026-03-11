import { Injectable } from '@nestjs/common';
import { CustomerDto, CustomerPublicApi } from '../customer.public-api';
import { Customer } from '../domain/entities/customer.entity';
import { CustomerRepositoryPort } from './ports/customer.repository.port';

@Injectable()
export class CustomerApplicationService implements CustomerPublicApi {
  constructor(private readonly customerRepo: CustomerRepositoryPort) {}

  async register(dto: CustomerDto): Promise<string> {
    const customer = Customer.create({
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      passwordHash: dto.passwordHash,
      isCompany: dto.isCompany,
      companyName: dto.companyName,
      tenantId: dto.tenantId,
    });

    const customerId = await this.customerRepo.save(customer);

    return customerId;
  }
}
