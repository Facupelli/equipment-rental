import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { User } from 'src/modules/users/entities/user.entity';
import { UsersRepository } from 'src/modules/users/users.repository';
import { UserMapper } from './user.mapper';

@Injectable()
export class PrismaUserRepository implements UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(): Promise<User[]> {
    const rawUsers = await this.prisma.user.findMany();
    return rawUsers.map((rawUser) => UserMapper.toDomain(rawUser));
  }

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

  async save(user: User): Promise<string> {
    const data = UserMapper.toPersistence(user);

    const result = await this.prisma.user.upsert({
      where: { id: user.id },
      create: data,
      update: data,
    });

    return result.id;
  }
}
