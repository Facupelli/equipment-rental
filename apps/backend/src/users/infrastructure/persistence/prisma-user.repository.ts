import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { User } from 'src/users/entities/user.entity';
import { UserRepository } from 'src/users/users.repository';
import { UserMapper } from './user.mapper';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    const rawUser = await this.prisma.user.findUnique({
      where: { id },
    });

    return rawUser ? UserMapper.toDomain(rawUser) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const rawUser = await this.prisma.user.findUnique({
      where: { email },
    });

    return rawUser ? UserMapper.toDomain(rawUser) : null;
  }

  async save(user: User): Promise<void> {
    const { id, ...data } = UserMapper.toPersistence(user);

    await this.prisma.user.upsert({
      where: { id },
      create: { id, ...data },
      update: data,
    });
  }
}
