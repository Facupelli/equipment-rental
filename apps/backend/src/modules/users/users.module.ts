import { Module } from '@nestjs/common';
import { BcryptUserValidator } from './services/bcript-user-validator.service';
import { UserValidator } from 'src/modules/auth/interfaces/user-validator.interface';
import { PrismaUserRepository } from './infrastructure/persistence/prisma-user.repository';
import { UsersService } from './services/users.service';
import { UsersController } from './users.controller';
import { UsersRepository } from './domain/repositories/users.repository';
import { PrismaRoleRepository } from './infrastructure/persistence/prisma-role.repository';
import { RolesService } from './services/roles.service';
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
