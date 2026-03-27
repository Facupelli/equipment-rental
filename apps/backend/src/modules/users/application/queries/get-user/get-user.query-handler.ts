import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from 'src/core/database/prisma.service';
import { GetUserQuery } from './get-user.query';
import { GetUserReadModel } from './get-user.types';

@QueryHandler(GetUserQuery)
export class GetUserQueryHandler implements IQueryHandler<GetUserQuery, GetUserReadModel | null> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetUserQuery): Promise<GetUserReadModel | null> {
    const user = await this.prisma.client.user.findFirst({
      where: {
        id: query.userId,
        tenantId: query.tenantId,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        tenantId: true,
        userRoles: {
          select: {
            locationId: true,
            role: {
              select: {
                id: true,
                name: true,
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
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.firstName + ' ' + user.lastName,
      isActive: user.isActive,
      tenantId: user.tenantId,
      roles: user.userRoles.map((ur) => ({
        roleId: ur.role.id,
        roleName: ur.role.name,
        locationId: ur.locationId,
      })),
    };
  }
}
