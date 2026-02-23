import { Injectable } from '@nestjs/common';
import { CustomerRepository } from './customer.repository';
import { Prisma } from 'src/generated/prisma/browser';

@Injectable()
export class CustomerService {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async create(data: Prisma.CustomerUncheckedCreateInput): Promise<string> {
    return await this.customerRepository.save(data);
  }
}
