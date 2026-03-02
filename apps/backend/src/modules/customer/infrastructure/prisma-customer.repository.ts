import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { CustomerRepositoryPort } from '../application/ports/customer.repository.port';
import { Customer } from '../domain/customer.entity';
import { CustomerMapper } from '../domain/customer.mapper';
import { CustomerQueryPort } from '../application/ports/customer-query.port';

@Injectable()
export class PrismaCustomerRepository implements CustomerRepositoryPort, CustomerQueryPort {
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

  async getCustomer(id: string): Promise<Customer | null> {
    const result = await this.prisma.client.customer.findUnique({
      where: { id },
    });

    if (!result) {
      return null;
    }

    return CustomerMapper.toDomain(result);
  }
}
