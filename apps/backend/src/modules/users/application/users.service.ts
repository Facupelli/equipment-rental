import { Injectable } from '@nestjs/common';
import { UserAuthPort } from 'src/modules/auth/domain/port/user-auth.port';
import { User } from '../domain/entities/user.entity';
import { UsersRepository } from '../domain/ports/users.repository.port';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';

@Injectable()
export class UsersService extends UserAuthPort {
  constructor(private readonly userRepository: UsersRepository) {
    super();
  }

  testMe() {
    return this.userRepository.findMany();
  }

  async findById(id: string): Promise<User | null> {
    return await this.userRepository.findById(id);
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findByEmail(email);
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
}
