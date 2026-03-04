import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from 'src/core/database/prisma.service';
import { MeResponseDto } from '../../dto/me-response.dto';
import { GetUserQuery } from './get-user.query';

@QueryHandler(GetUserQuery)
export class GetUserQueryHandler implements IQueryHandler<GetUserQuery, MeResponseDto | null> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetUserQuery): Promise<MeResponseDto | null> {
    const user = await this.prisma.client.user.findUnique({
      where: { id: query.userId },
      include: {
        tenant: true,
        userRoles: {
          include: {
            role: {
              include: {
                permissions: true,
              },
            },
            location: true,
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
