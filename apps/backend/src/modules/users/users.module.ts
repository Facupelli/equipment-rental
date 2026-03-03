import { Module } from '@nestjs/common';
import { UsersService } from './application/users.service';
import { UsersController } from './infrastructure/controllers/users.controller';
import { UsersRepositoryPort } from 'dist/src/modules/users/application/ports/users.repository.port';
import { UserRepository } from './infrastructure/persistence/repositories/user.repository';
import { RoleRepositoryPort } from './domain/ports/role.repository.port';
import { RoleRepository } from './infrastructure/persistence/repositories/role.repository';
import { InvitationRepositoryPort } from './domain/ports/invitation.repository.port';
import { InvitationRepository } from './infrastructure/persistence/repositories/invitation.repository';
import { UsersPublicApi } from './application/users-public-api';

const repositories = [
  { provide: UsersRepositoryPort, useClass: UserRepository },
  { provide: RoleRepositoryPort, useClass: RoleRepository },
  { provide: InvitationRepositoryPort, useClass: InvitationRepository },
];

const services = [UsersService];

@Module({
  controllers: [UsersController],
  providers: [...repositories, ...services],
  exports: [{ provide: UsersPublicApi, useClass: UsersService }],
})
export class UsersModule {}
