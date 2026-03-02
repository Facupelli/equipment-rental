import { Module } from '@nestjs/common';
import { BcryptUserValidator } from './infrastructure/adapters/bcript-user-validator.service';
import { UserValidator } from 'src/modules/auth/domain/port/user-validator.port';
import { PrismaUserRepository } from './infrastructure/persistence/prisma-user.repository';
import { UsersService } from './application/users.service';
import { UsersController } from './infrastructure/controllers/users.controller';
import { PrismaRoleRepository } from './infrastructure/persistence/prisma-role.repository';
import { RolesService } from './application/roles.service';
import { UserQueryPort } from './application/ports/user-query.port';
import { UsersRepositoryPort } from './application/ports/users.repository.port';
import { RoleRepositoryPort } from './application/ports/role.repository.port';
import { UserCommandPort } from './application/ports/user-command.port';
import { RoleCommandPort } from './application/ports/role-command.port';

const repositories = [
  { provide: UsersRepositoryPort, useClass: PrismaUserRepository },
  { provide: RoleRepositoryPort, useClass: PrismaRoleRepository },
];

const services = [RolesService, UsersService, { provide: UserValidator, useClass: BcryptUserValidator }];

@Module({
  controllers: [UsersController],
  providers: [...repositories, ...services],
  exports: [
    { provide: UserValidator, useClass: BcryptUserValidator },
    { provide: UserQueryPort, useClass: UsersService },
    { provide: UserCommandPort, useClass: UsersService },
    { provide: RoleCommandPort, useClass: RolesService },
  ],
})
export class UsersModule {}
