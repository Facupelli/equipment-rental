import { Module } from '@nestjs/common';
import { BcryptUserValidator } from './services/bcript-user-validator.service';
import { UserValidator } from 'src/modules/auth/interfaces/user-validator.interface';
import { UsersRepository } from './users.repository';
import { PrismaUserRepository } from './infrastructure/persistence/prisma-user.repository';
import { UsersService } from './services/users-service';
import { UsersController } from './users.controller';

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    { provide: UsersRepository, useClass: PrismaUserRepository },
    { provide: UserValidator, useClass: BcryptUserValidator },
  ],
  exports: [{ provide: UserValidator, useClass: BcryptUserValidator }, UsersService],
})
export class UsersModule {}
