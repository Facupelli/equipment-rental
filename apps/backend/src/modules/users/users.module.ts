import { Module } from '@nestjs/common';
import { BcryptUserValidator } from './infrastructure/adapters/bcript-user-validator.service';
import { UserValidator } from 'src/modules/auth/domain/port/user-validator.port';
import { PrismaUserRepository } from './infrastructure/persistence/prisma-user.repository';
import { UsersService } from './application/users.service';
import { UsersController } from './infrastructure/controllers/users.controller';
import { PrismaRoleRepository } from './infrastructure/persistence/prisma-role.repository';
import { RolesService } from './application/roles.service';
import { RoleRepositoryPort } from './domain/ports/role.repository.port';
import { UsersRepositoryPort } from './domain/ports/users.repository.port';

const repositories = [
  { provide: UsersRepositoryPort, useClass: PrismaUserRepository },
  { provide: RoleRepositoryPort, useClass: PrismaRoleRepository },
];

const services = [RolesService, UsersService, { provide: UserValidator, useClass: BcryptUserValidator }];

@Module({
  controllers: [UsersController],
  providers: [...repositories, ...services],
  exports: [{ provide: UserValidator, useClass: BcryptUserValidator }, UsersService, RolesService],
})
export class UsersModule {}
