import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from 'src/core/database/prisma.service';
import { FindCredentialsByEmailQuery } from './find-credentials-by-email.query';

export interface UserCredentials {
  id: string;
  tenantId: string;
  email: string;
  passwordHash: string;
  isActive: boolean;
  // Nested structure to handle Location-specific roles
  roles: Array<{
    id: string;
  }>;
}

@QueryHandler(FindCredentialsByEmailQuery)
export class FindCredentialsByEmailQueryHandler implements IQueryHandler<
  FindCredentialsByEmailQuery,
  UserCredentials | null
> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: FindCredentialsByEmailQuery): Promise<UserCredentials | null> {
    const user = await this.prisma.client.user.findFirst({
      where: { email: query.email, deletedAt: null },
      select: {
        id: true,
        tenantId: true,
        email: true,
        passwordHash: true,
        isActive: true,
        userRoles: {
          select: {
            locationId: true,
            role: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      passwordHash: user.passwordHash,
      isActive: user.isActive,
      roles: user.userRoles.map((ur) => ({
        id: ur.role.id,
      })),
    };
  }
}
