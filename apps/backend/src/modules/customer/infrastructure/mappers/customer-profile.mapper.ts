import { CustomerProfile as PrismaCustomerProfile, Prisma } from 'src/generated/prisma/client';
import { CustomerProfile, ProfileSubmissionStatus } from '../../domain/entities/customer-profile.entity';

export class CustomerProfileMapper {
  static toDomain(raw: PrismaCustomerProfile): CustomerProfile {
    return CustomerProfile.reconstitute({
      id: raw.id,
      customerId: raw.customerId,
      status: raw.status as ProfileSubmissionStatus,
      fullName: raw.fullName,
      phone: raw.phone,
      birthDate: raw.birthDate,
      documentNumber: raw.documentNumber,
      identityDocumentPath: raw.identityDocumentPath,
      address: raw.address,
      city: raw.city,
      stateRegion: raw.stateRegion,
      country: raw.country,
      occupation: raw.occupation,
      company: raw.company,
      taxId: raw.taxId,
      businessName: raw.businessName,
      bankName: raw.bankName,
      accountNumber: raw.accountNumber,
      contact1Name: raw.contact1Name,
      contact1Relationship: raw.contact1Relationship,
      contact2Name: raw.contact2Name,
      contact2Relationship: raw.contact2Relationship,
      rejectionReason: raw.rejectionReason,
      reviewedAt: raw.reviewedAt,
      reviewedById: raw.reviewedById,
    });
  }

  static toPersistence(entity: CustomerProfile): Prisma.CustomerProfileUncheckedCreateInput {
    return {
      id: entity.id,
      customerId: entity.customerId,
      status: entity.getStatus(),
      fullName: entity.fullName,
      phone: entity.phone,
      birthDate: entity.birthDate,
      documentNumber: entity.documentNumber,
      identityDocumentPath: entity.identityDocumentPath,
      address: entity.address,
      city: entity.city,
      stateRegion: entity.stateRegion,
      country: entity.country,
      occupation: entity.occupation,
      company: entity.company,
      taxId: entity.taxId,
      businessName: entity.businessName,
      bankName: entity.bankName,
      accountNumber: entity.accountNumber,
      contact1Name: entity.contact1Name,
      contact1Relationship: entity.contact1Relationship,
      contact2Name: entity.contact2Name,
      contact2Relationship: entity.contact2Relationship,
      rejectionReason: entity.getRejectionReason(),
      reviewedAt: entity.getReviewedAt(),
      reviewedById: entity.getReviewedById(),
    };
  }

  static toNewProfilePersistence(entity: CustomerProfile): Prisma.CustomerProfileUncheckedCreateWithoutCustomerInput {
    return {
      id: entity.id,
      status: entity.getStatus(),
      fullName: entity.fullName,
      phone: entity.phone,
      birthDate: entity.birthDate,
      documentNumber: entity.documentNumber,
      identityDocumentPath: entity.identityDocumentPath,
      address: entity.address,
      city: entity.city,
      stateRegion: entity.stateRegion,
      country: entity.country,
      occupation: entity.occupation,
      company: entity.company,
      taxId: entity.taxId,
      businessName: entity.businessName,
      bankName: entity.bankName,
      accountNumber: entity.accountNumber,
      contact1Name: entity.contact1Name,
      contact1Relationship: entity.contact1Relationship,
      contact2Name: entity.contact2Name,
      contact2Relationship: entity.contact2Relationship,
      rejectionReason: entity.getRejectionReason(),
      reviewedAt: entity.getReviewedAt(),
      reviewedById: entity.getReviewedById(),
    };
  }

  static toExistingProfileUpdatePersistence(
    entity: CustomerProfile,
  ): Prisma.CustomerProfileUncheckedUpdateWithoutCustomerInput {
    return {
      id: entity.id,
      status: entity.getStatus(),
      fullName: entity.fullName,
      phone: entity.phone,
      birthDate: entity.birthDate,
      documentNumber: entity.documentNumber,
      identityDocumentPath: entity.identityDocumentPath,
      address: entity.address,
      city: entity.city,
      stateRegion: entity.stateRegion,
      country: entity.country,
      occupation: entity.occupation,
      company: entity.company,
      taxId: entity.taxId,
      businessName: entity.businessName,
      bankName: entity.bankName,
      accountNumber: entity.accountNumber,
      contact1Name: entity.contact1Name,
      contact1Relationship: entity.contact1Relationship,
      contact2Name: entity.contact2Name,
      contact2Relationship: entity.contact2Relationship,
      rejectionReason: entity.getRejectionReason(),
      reviewedAt: entity.getReviewedAt(),
      reviewedById: entity.getReviewedById(),
    };
  }
}
