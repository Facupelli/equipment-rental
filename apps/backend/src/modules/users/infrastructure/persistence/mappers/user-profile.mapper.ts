import { Prisma } from 'src/generated/prisma/client';
import { UserProfile } from 'src/modules/users/domain/entities/user-profile.entity';

type PrismaUserProfileRecord = {
  id: string;
  userId: string;
  fullName: string;
  documentNumber: string;
  phone: string;
  address: string;
  signUrl: string;
};

export class UserProfileMapper {
  static toDomain(raw: PrismaUserProfileRecord): UserProfile {
    return UserProfile.reconstitute({
      id: raw.id,
      userId: raw.userId,
      fullName: raw.fullName,
      documentNumber: raw.documentNumber,
      phone: raw.phone,
      address: raw.address,
      signUrl: raw.signUrl,
    });
  }

  static toPersistence(entity: UserProfile): Prisma.UserProfileUncheckedCreateInput {
    return {
      id: entity.id,
      userId: entity.userId,
      fullName: entity.currentFullName,
      documentNumber: entity.currentDocumentNumber,
      phone: entity.currentPhone,
      address: entity.currentAddress,
      signUrl: entity.currentSignUrl,
    };
  }

  static toUpdateData(entity: UserProfile): Prisma.UserProfileUpdateInput {
    return {
      fullName: entity.currentFullName,
      documentNumber: entity.currentDocumentNumber,
      phone: entity.currentPhone,
      address: entity.currentAddress,
      signUrl: entity.currentSignUrl,
    };
  }
}
