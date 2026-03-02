import { Prisma, Customer as PrismaCustomer } from 'src/generated/prisma/client';
import { Customer, CustomerProps } from './domain/customer.entity';
import { CustomerStatus } from '@repo/types';

export class CustomerMapper {
  public static toDomain(prismaCustomer: PrismaCustomer): Customer {
    const props: CustomerProps = {
      id: prismaCustomer.id,
      tenantId: prismaCustomer.tenantId,
      name: prismaCustomer.name,
      email: prismaCustomer.email,
      phone: prismaCustomer.phone,
      status: prismaCustomer.status as CustomerStatus,
      createdAt: prismaCustomer.createdAt,
      updatedAt: prismaCustomer.updatedAt,
    };

    return Customer.reconstitute(props);
  }

  public static toPersistence(entity: Customer): Prisma.CustomerUncheckedCreateInput {
    return {
      id: entity.id,
      tenantId: entity.tenantId,
      name: entity.name,
      email: entity.email,
      phone: entity.phone,
      status: entity.status,
    };
  }

  public static toPersistenceUpdate(entity: Customer): Prisma.CustomerUncheckedUpdateInput {
    return {
      name: entity.name,
      email: entity.email,
      phone: entity.phone,
      status: entity.status,
    };
  }
}
