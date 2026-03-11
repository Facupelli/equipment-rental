import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import * as bcrypt from 'bcrypt';
import { ActorType } from '@repo/types';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class TokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async store(
    actorId: string,
    actorType: ActorType,
    tokenId: string,
    rawToken: string,
    expiresAt: Date,
  ): Promise<void> {
    const tokenHash = await bcrypt.hash(rawToken, BCRYPT_ROUNDS);

    await this.prisma.client.refreshToken.create({
      data: {
        id: tokenId,
        actorId,
        actorType,
        tokenHash,
        expiresAt,
      },
    });
  }

  async find(jti: string, actorType: ActorType) {
    return this.prisma.client.refreshToken.findUnique({
      where: { id: jti, actorType },
    });
  }

  async revokeOne(jti: string): Promise<void> {
    await this.prisma.client.refreshToken.update({
      where: { id: jti },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAll(actorId: string, actorType: ActorType): Promise<void> {
    await this.prisma.client.refreshToken.updateMany({
      where: {
        actorId,
        actorType,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }

  async rotateToken(
    oldTokenId: string,
    actorId: string,
    actorType: ActorType,
    newTokenId: string,
    rawToken: string,
    expiresAt: Date,
  ): Promise<void> {
    const tokenHash = await bcrypt.hash(rawToken, BCRYPT_ROUNDS);

    await this.prisma.client.$transaction([
      this.prisma.client.refreshToken.update({
        where: { id: oldTokenId },
        data: { revokedAt: new Date() },
      }),
      this.prisma.client.refreshToken.create({
        data: {
          id: newTokenId,
          actorId,
          actorType,
          tokenHash,
          expiresAt,
        },
      }),
    ]);
  }
}
