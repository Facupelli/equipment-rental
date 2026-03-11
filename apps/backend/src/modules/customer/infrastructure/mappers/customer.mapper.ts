import {
  Customer as PrismaCustomer,
  CustomerProfile as PrismaCustomerProfile,
  Prisma,
} from 'src/generated/prisma/client';
import { Customer, OnboardingStatus } from '../../domain/entities/customer.entity';
import { CustomerProfileMapper } from './customer-profile.mapper';

type PrismaCustomerWithRelations = PrismaCustomer & {
  profile: PrismaCustomerProfile | null;
};

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
      onboardingStatus: raw.onboardingStatus as OnboardingStatus,
      profile: raw.profile ? CustomerProfileMapper.toDomain(raw.profile) : null,
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
      onboardingStatus: entity.currentOnboardingStatus,
    };
  }

  static toUpdatePersistence(entity: Customer): Prisma.CustomerUncheckedUpdateInput {
    const profile = entity.getProfile();

    return {
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
      onboardingStatus: entity.currentOnboardingStatus,
      profile: profile
        ? {
            upsert: {
              create: CustomerProfileMapper.toPersistence(profile),
              update: CustomerProfileMapper.toPersistence(profile),
            },
          }
        : undefined,
    };
  }
}
