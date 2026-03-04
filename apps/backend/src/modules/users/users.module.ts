import { Module } from '@nestjs/common';
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

const repositories = [
  { provide: UserRepositoryPort, useClass: UserRepository },
  { provide: RoleRepositoryPort, useClass: RoleRepository },
  { provide: InvitationRepositoryPort, useClass: InvitationRepository },
];

const queryHandlers = [FindCredentialsByEmailQueryHandler, IsEmailTakenQueryHandler, GetUserQueryHandler];

const services = [UsersService, { provide: UsersPublicApi, useClass: UsersService }];

@Module({
  controllers: [UsersController],
  providers: [...repositories, ...services, ...queryHandlers],
  exports: [{ provide: UsersPublicApi, useClass: UsersService }],
})
export class UsersModule {}
