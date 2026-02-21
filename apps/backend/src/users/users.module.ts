import { Module } from '@nestjs/common';
import { BcryptUserValidator } from './bcript-user-validator';
import { UserValidator } from 'src/modules/auth/interfaces/user-validator.interface';
import { UserRepository } from './users.repository';
import { PrismaUserRepository } from './infrastructure/persistence/prisma-user.repository';

@Module({
  providers: [
    { provide: UserRepository, useClass: PrismaUserRepository },
    { provide: UserValidator, useClass: BcryptUserValidator },
  ],
  exports: [{ provide: UserValidator, useClass: BcryptUserValidator }],
})
export class UsersModule {}
