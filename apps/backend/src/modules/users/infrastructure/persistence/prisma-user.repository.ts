import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { User } from 'src/modules/users/domain/entities/user.entity';
import { UserMapper } from './user.mapper';
import { UsersRepositoryPort } from '../../domain/ports/users.repository.port';

@Injectable()
export class PrismaUserRepository implements UsersRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async load(id: string): Promise<User | null> {
    const rawUser = await this.prisma.client.user.findUnique({
      where: { id },
    });

    return rawUser ? UserMapper.toDomain(rawUser) : null;
  }

  async isEmailTaken(email: string): Promise<boolean> {
    const count = await this.prisma.client.user.count({
      where: { email },
    });

    return count > 0;
  }

  async save(user: User): Promise<string> {
    const data = UserMapper.toPersistence(user);

    const result = await this.prisma.client.user.upsert({
      where: { id: user.id },
      create: data,
      update: data,
    });

    return result.id;
  }
}
