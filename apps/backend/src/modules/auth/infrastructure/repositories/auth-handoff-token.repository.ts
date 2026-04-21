import { createHash } from 'crypto';

import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/core/database/prisma.service';

import { AuthHandoffToken } from '../../domain/entities/auth-handoff-token.entity';
import { AuthHandoffTokenMapper } from '../mappers/auth-handoff-token.mapper';

@Injectable()
export class AuthHandoffTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByRawToken(rawToken: string): Promise<AuthHandoffToken | null> {
    const tokenHash = AuthHandoffTokenRepository.hashToken(rawToken);

    const record = await this.prisma.client.authHandoffToken.findUnique({
      where: { tokenHash },
    });

    return record ? AuthHandoffTokenMapper.toDomain(record) : null;
  }

  async save(token: AuthHandoffToken): Promise<void> {
    await this.prisma.client.authHandoffToken.upsert({
      where: { id: token.id },
      create: AuthHandoffTokenMapper.toPersistence(token),
      update: AuthHandoffTokenMapper.toUpdatePersistence(token),
    });
  }

  static hashToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }
}
