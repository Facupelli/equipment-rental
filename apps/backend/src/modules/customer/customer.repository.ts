import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { CustomerServiceRepository } from './ports/customer-service.repository';
import { RentalCustomerQueryPort } from '../rental/domain/ports/rental-customer.port';
import { Customer } from './customer.entity';
import { CustomerMapper } from './customer.mapper';

@Injectable()
export class CustomerRepository implements CustomerServiceRepository, RentalCustomerQueryPort {
  constructor(private readonly prisma: PrismaService) {}

  async save(customer: Customer): Promise<string> {
    const createData = CustomerMapper.toPersistence(customer);
    const updateData = CustomerMapper.toPersistenceUpdate(customer);

    const result = await this.prisma.client.customer.upsert({
      where: { id: customer.id },
      create: createData,
      update: updateData,
    });

    return result.id;
  }

  async findById(id: string): Promise<Customer | null> {
    const result = await this.prisma.client.customer.findUnique({
      where: { id },
    });

    if (!result) {
      return null;
    }

    return CustomerMapper.toDomain(result);
  }
}
