import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { UserProfile } from 'src/modules/users/domain/entities/user-profile.entity';

import { UserProfileMapper } from '../mappers/user-profile.mapper';

@Injectable()
export class UserProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<UserProfile | null> {
    const raw = await this.prisma.client.userProfile.findUnique({
      where: { userId },
    });

    if (!raw) {
      return null;
    }

    return UserProfileMapper.toDomain(raw);
  }

  async save(profile: UserProfile): Promise<string> {
    await this.prisma.client.userProfile.upsert({
      where: { id: profile.id },
      create: UserProfileMapper.toPersistence(profile),
      update: UserProfileMapper.toUpdateData(profile),
    });

    return profile.id;
  }
}
