import { Module } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { UserRepository } from './infrastructure/persistence/repositories/user.repository';
import { UserProfileRepository } from './infrastructure/persistence/repositories/user-profile.repository';
import { RoleRepository } from './infrastructure/persistence/repositories/role.repository';
import { InvitationRepository } from './infrastructure/persistence/repositories/invitation.repository';
import { UsersPublicApi } from './users.public-api';
import { UsersFacade } from './application/users.facade';
import { GetUserHttpController } from './application/queries/get-user/get-user.http.controller';
import { GetUserProfileHttpController } from './application/queries/get-user-profile/get-user-profile.http.controller';
import { FindCredentialsByEmailQueryHandler } from './application/queries/find-credentials-by-email/find-credentials-by-email.query-handler';
import { GetUserQueryHandler } from './application/queries/get-user/get-user.query-handler';
import { GetUserProfileQueryHandler } from './application/queries/get-user-profile/get-user-profile.query-handler';
import { GetUserPermissionsQueryHandler } from './application/queries/get-user-permissions/get-user-permissions.query-handler';
import { GetTenantAdminSignerProfileQueryHandler } from './application/queries/get-tenant-admin-signer-profile/get-tenant-admin-signer-profile.query-handler';
import { IsEmailTakenQueryHandler } from './application/queries/is-email-taken/is-email-taken.query-handler';
import { CreateUserService } from './application/commands/create-user/create-user.service';
import { CreateUserProfileService } from './application/commands/create-user-profile/create-user-profile.service';
import { CreateRoleService } from './application/commands/create-role/create-role.service';
import { SyncAdminRolePermissionsService } from './application/commands/sync-admin-role-permissions/sync-admin-role-permissions.service';
import { UpdateUserProfileService } from './application/commands/update-user-profile/update-user-profile.service';
import { BootstrapTenantAdminService } from './application/services/bootstrap-tenant-admin.service';
import { CreateUserProfileHttpController } from './application/commands/create-user-profile/create-user-profile.http.controller';
import { UpdateUserProfileHttpController } from './application/commands/update-user-profile/update-user-profile.http.controller';

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
  UserProfileRepository,
  InvitationRepository,
];

const commandHandlers = [
  CreateUserService,
  CreateUserProfileService,
  CreateRoleService,
  SyncAdminRolePermissionsService,
  UpdateUserProfileService,
];
const queryHandlers = [
  FindCredentialsByEmailQueryHandler,
  IsEmailTakenQueryHandler,
  GetUserQueryHandler,
  GetUserProfileQueryHandler,
  GetTenantAdminSignerProfileQueryHandler,
  GetUserPermissionsQueryHandler,
];

const services = [BootstrapTenantAdminService, UsersFacade, { provide: UsersPublicApi, useExisting: UsersFacade }];

@Module({
  controllers: [
    CreateUserProfileHttpController,
    GetUserHttpController,
    GetUserProfileHttpController,
    UpdateUserProfileHttpController,
  ],
  providers: [...repositories, ...services, ...commandHandlers, ...queryHandlers],
  exports: [UsersPublicApi],
})
export class UsersModule {}
