import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { PrismaService } from 'src/core/database/prisma.service';

import { GetUserProfileQuery } from './get-user-profile.query';
import { GetUserProfileReadModel } from './get-user-profile.read-model';

@QueryHandler(GetUserProfileQuery)
export class GetUserProfileQueryHandler implements IQueryHandler<GetUserProfileQuery, GetUserProfileReadModel | null> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetUserProfileQuery): Promise<GetUserProfileReadModel | null> {
    const profile = await this.prisma.client.userProfile.findFirst({
      where: {
        userId: query.userId,
        user: {
          tenantId: query.tenantId,
          deletedAt: null,
        },
      },
      select: {
        id: true,
        userId: true,
        fullName: true,
        documentNumber: true,
        phone: true,
        address: true,
        signUrl: true,
      },
    });

    if (!profile) {
      return null;
    }

    return {
      id: profile.id,
      userId: profile.userId,
      fullName: profile.fullName,
      documentNumber: profile.documentNumber,
      phone: profile.phone,
      address: profile.address,
      signUrl: profile.signUrl,
    };
  }
}
