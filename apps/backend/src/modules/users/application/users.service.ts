import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '../domain/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import { UserQueryPort } from './ports/user-query.port';
import { UsersRepositoryPort } from './ports/users.repository.port';
import { UserCommandPort } from './ports/user-command.port';

@Injectable()
export class UsersService implements UserQueryPort, UserCommandPort {
  constructor(private readonly userRepository: UsersRepositoryPort) {}

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.load(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async create(dto: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    tenantId: string;
    roleId: string;
  }): Promise<string> {
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = User.create(
      randomUUID(),
      dto.email,
      passwordHash,
      dto.firstName,
      dto.lastName,
      dto.tenantId,
      dto.roleId,
    );

    return await this.userRepository.save(user);
  }

  // query port
  async isEmailTaken(email: string): Promise<boolean> {
    return await this.userRepository.isEmailTaken(email);
  }
}
