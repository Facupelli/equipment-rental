import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from 'src/core/database/prisma.service';
import { FindUserCredentialsByEmailQuery } from '../../../public/queries/find-user-credentials-by-email.query';
import { UserCredentialsReadModel } from '../../../public/read-models/user-credentials.read-model';

@QueryHandler(FindUserCredentialsByEmailQuery)
export class FindCredentialsByEmailQueryHandler implements IQueryHandler<
  FindUserCredentialsByEmailQuery,
  UserCredentialsReadModel | null
> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: FindUserCredentialsByEmailQuery): Promise<UserCredentialsReadModel | null> {
    const user = await this.prisma.client.user.findFirst({
      where: {
        tenantId: query.tenantId,
        email: query.email,
        deletedAt: null,
      },
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
