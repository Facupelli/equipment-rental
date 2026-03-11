import { Injectable } from '@nestjs/common';
import { Customer } from '../../domain/entities/customer.entity';
import { CustomerMapper } from '../mappers/customer.mapper';
import { CustomerRepositoryPort } from '../../domain/ports/customer.repository.port';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class CustomerRepository implements CustomerRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async load(id: string): Promise<Customer | null> {
    const raw = await this.prisma.client.customer.findUnique({
      where: { id },
      include: {
        profile: true,
      },
    });

    if (!raw) {
      return null;
    }

    return CustomerMapper.toDomain(raw);
  }

  async save(customer: Customer): Promise<string> {
    await this.prisma.client.customer.upsert({
      where: { id: customer.id },
      create: CustomerMapper.toPersistence(customer),
      update: CustomerMapper.toUpdatePersistence(customer),
    });

    return customer.id;
  }
}
