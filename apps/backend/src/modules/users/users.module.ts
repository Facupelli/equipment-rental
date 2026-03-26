import { Module } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { UsersService } from './application/users.service';
import { UsersController } from './infrastructure/controllers/users.controller';
import { UserRepository } from './infrastructure/persistence/repositories/user.repository';
import { RoleRepositoryPort } from './domain/ports/role.repository.port';
import { RoleRepository } from './infrastructure/persistence/repositories/role.repository';
import { InvitationRepositoryPort } from './domain/ports/invitation.repository.port';
import { InvitationRepository } from './infrastructure/persistence/repositories/invitation.repository';
import { UsersPublicApi } from './application/users-public-api';
import { UserRepositoryPort } from './domain/ports/user.repository.port';
import { FindCredentialsByEmailQueryHandler } from './application/queries/find-credentials-by-email/find-credentials-by-email.query-handerl';
import { GetUserQueryHandler } from './application/queries/get-user/get-user.query-handler';
import { IsEmailTakenQueryHandler } from './application/queries/is-email-taken/is-email-taken.query-handler';
import { SyncAdminRolePermissionsService } from './application/commands/sync-admin-role-permissions/sync-admin-role-permissions.service';

const repositories = [
  {
    provide: UserRepository,
    useFactory: (prisma: PrismaService) => new UserRepository(prisma.client),
    inject: [PrismaService],
  },
  { provide: UserRepositoryPort, useExisting: UserRepository },
  {
    provide: RoleRepository,
    useFactory: (prisma: PrismaService) => new RoleRepository(prisma.client),
    inject: [PrismaService],
  },
  { provide: RoleRepositoryPort, useExisting: RoleRepository },
  InvitationRepository,
  { provide: InvitationRepositoryPort, useExisting: InvitationRepository },
];

const commandHandlers = [SyncAdminRolePermissionsService];
const queryHandlers = [FindCredentialsByEmailQueryHandler, IsEmailTakenQueryHandler, GetUserQueryHandler];

const services = [UsersService, { provide: UsersPublicApi, useExisting: UsersService }];

@Module({
  controllers: [UsersController],
  providers: [...repositories, ...services, ...commandHandlers, ...queryHandlers],
  exports: [UsersPublicApi, UserRepository, RoleRepository],
})
export class UsersModule {}
