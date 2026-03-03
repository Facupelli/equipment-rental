import { Customer as PrismaCustomer, Prisma } from 'src/generated/prisma/client';
import { Customer } from '../../domain/entities/customer.entity';

type PrismaCustomerWithRelations = PrismaCustomer;

export class CustomerMapper {
  static toDomain(raw: PrismaCustomerWithRelations): Customer {
    return Customer.reconstitute({
      id: raw.id,
      tenantId: raw.tenantId,
      email: raw.email,
      passwordHash: raw.passwordHash,
      firstName: raw.firstName,
      lastName: raw.lastName,
      phone: raw.phone,
      isCompany: raw.isCompany,
      companyName: raw.companyName,
      taxId: raw.taxId,
      isActive: raw.isActive,
      deletedAt: raw.deletedAt,
    });
  }

  static toPersistence(entity: Customer): Prisma.CustomerUncheckedCreateInput {
    return {
      id: entity.id,
      tenantId: entity.tenantId,
      email: entity.email,
      passwordHash: entity.currentPasswordHash,
      firstName: entity.firstName,
      lastName: entity.lastName,
      phone: entity.phone,
      isCompany: entity.isCompany,
      companyName: entity.companyName,
      taxId: entity.taxId,
      isActive: entity.active,
      deletedAt: entity.deletedOn,
    };
  }
}
