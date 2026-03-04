import { Module } from '@nestjs/common';
import { UsersService } from './application/users.service';
import { UsersController } from './infrastructure/controllers/users.controller';
import { UserRepository } from './infrastructure/persistence/repositories/user.repository';
import { RoleRepositoryPort } from './domain/ports/role.repository.port';
import { RoleRepository } from './infrastructure/persistence/repositories/role.repository';
import { InvitationRepositoryPort } from './domain/ports/invitation.repository.port';
import { InvitationRepository } from './infrastructure/persistence/repositories/invitation.repository';
import { UsersPublicApi } from './application/users-public-api';
import { UserReadService, UserRepositoryPort } from './domain/ports/user.repository.port';

const repositories = [
  { provide: UserRepositoryPort, useClass: UserRepository },
  { provide: UserReadService, useClass: UserRepository },
  { provide: RoleRepositoryPort, useClass: RoleRepository },
  { provide: InvitationRepositoryPort, useClass: InvitationRepository },
];

const services = [UsersService, { provide: UsersPublicApi, useClass: UsersService }];

@Module({
  controllers: [UsersController],
  providers: [...repositories, ...services],
  exports: [{ provide: UsersPublicApi, useClass: UsersService }],
})
export class UsersModule {}
