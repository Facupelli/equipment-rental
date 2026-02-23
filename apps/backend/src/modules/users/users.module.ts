import { Module } from '@nestjs/common';
import { BcryptUserValidator } from './infrastructure/adapters/bcript-user-validator.service';
import { UserValidator } from 'src/modules/auth/domain/port/user-validator.port';
import { PrismaUserRepository } from './infrastructure/persistence/prisma-user.repository';
import { UsersService } from './application/users.service';
import { UsersController } from './infrastructure/controllers/users.controller';
import { UsersRepository } from './domain/repositories/users.repository';
import { PrismaRoleRepository } from './infrastructure/persistence/prisma-role.repository';
import { RolesService } from './application/roles.service';
import { RoleRepository } from './domain/repositories/role.repository';

const repositories = [
  { provide: UsersRepository, useClass: PrismaUserRepository },
  { provide: RoleRepository, useClass: PrismaRoleRepository },
];

const services = [RolesService, UsersService, { provide: UserValidator, useClass: BcryptUserValidator }];

@Module({
  controllers: [UsersController],
  providers: [...repositories, ...services],
  exports: [{ provide: UserValidator, useClass: BcryptUserValidator }, UsersService, RolesService],
})
export class UsersModule {}
