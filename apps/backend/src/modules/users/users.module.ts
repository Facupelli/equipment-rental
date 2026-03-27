import { Module } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { UserRepository } from './infrastructure/persistence/repositories/user.repository';
import { RoleRepository } from './infrastructure/persistence/repositories/role.repository';
import { InvitationRepository } from './infrastructure/persistence/repositories/invitation.repository';
import { UsersPublicApi } from './users.public-api';
import { UsersFacade } from './application/users.facade';
import { GetUserHttpController } from './application/queries/get-user/get-user.http.controller';
import { FindCredentialsByEmailQueryHandler } from './application/queries/find-credentials-by-email/find-credentials-by-email.query-handler';
import { GetUserQueryHandler } from './application/queries/get-user/get-user.query-handler';
import { IsEmailTakenQueryHandler } from './application/queries/is-email-taken/is-email-taken.query-handler';
import { CreateUserService } from './application/commands/create-user/create-user.service';
import { CreateRoleService } from './application/commands/create-role/create-role.service';
import { SyncAdminRolePermissionsService } from './application/commands/sync-admin-role-permissions/sync-admin-role-permissions.service';
import { BootstrapTenantAdminService } from './application/services/bootstrap-tenant-admin.service';

const repositories = [
  {
    provide: UserRepository,
    useFactory: (prisma: PrismaService) => new UserRepository(prisma.client),
    inject: [PrismaService],
  },
  {
    provide: RoleRepository,
    useFactory: (prisma: PrismaService) => new RoleRepository(prisma.client),
    inject: [PrismaService],
  },
  InvitationRepository,
];

const commandHandlers = [CreateUserService, CreateRoleService, SyncAdminRolePermissionsService];
const queryHandlers = [FindCredentialsByEmailQueryHandler, IsEmailTakenQueryHandler, GetUserQueryHandler];

const services = [BootstrapTenantAdminService, UsersFacade, { provide: UsersPublicApi, useExisting: UsersFacade }];

@Module({
  controllers: [GetUserHttpController],
  providers: [...repositories, ...services, ...commandHandlers, ...queryHandlers],
  exports: [UsersPublicApi],
})
export class UsersModule {}
