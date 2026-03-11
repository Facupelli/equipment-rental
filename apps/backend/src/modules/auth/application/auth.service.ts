import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { Env } from 'src/config/env.schema';
import { PrismaService } from 'src/core/database/prisma.service';
import { JwtPayload } from '../infrastructure/strategies/jwt.strategy';
import { RefreshTokenPayload } from '../infrastructure/strategies/jwt-refresh.strategy';
import { TokenRepository } from '../infrastructure/repositories/token.repository';
import { ActorType } from '@repo/types';

// Minimal actor shape required to issue tokens.
// Both User and Customer satisfy this interface.
interface TokenActor {
  id: string;
  email: string;
  tenantId: string;
  actorType: ActorType;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<Env, true>,
    private readonly prisma: PrismaService,
    private readonly tokenRepository: TokenRepository,
  ) {}

  async login(actor: TokenActor): Promise<{ accessToken: string; refreshToken: string }> {
    const { accessToken } = this.signAccessToken(actor);
    const { refreshToken, tokenId } = this.signRefreshToken(actor);
    const expiresAt = this.refreshTokenExpiresAt();

    await this.tokenRepository.store(actor.id, actor.actorType, tokenId, refreshToken, expiresAt);

    return { accessToken, refreshToken };
  }

  async refreshTokens(
    actorId: string,
    actorType: ActorType,
    oldTokenId: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const actor = await this.resolveActor(actorId, actorType);

    const { accessToken } = this.signAccessToken(actor);
    const { refreshToken, tokenId: newTokenId } = this.signRefreshToken(actor);
    const expiresAt = this.refreshTokenExpiresAt();

    await this.tokenRepository.rotateToken(oldTokenId, actorId, actorType, newTokenId, refreshToken, expiresAt);

    return { accessToken, refreshToken };
  }

  async logout(actorId: string, actorType: ActorType): Promise<void> {
    await this.tokenRepository.revokeAll(actorId, actorType);
  }

  // ── Private ───────────────────────────────────────────────────────────────

  // Fetches fresh claims for token signing. Keeps issued tokens up-to-date
  // with the latest actor state (e.g. email change, tenant change).
  private async resolveActor(actorId: string, actorType: ActorType): Promise<TokenActor> {
    if (actorType === ActorType.USER) {
      const user = await this.prisma.client.user.findUniqueOrThrow({ where: { id: actorId } });
      return { ...user, actorType: ActorType.USER };
    }

    const customer = await this.prisma.client.customer.findUniqueOrThrow({ where: { id: actorId } });
    return { ...customer, actorType: ActorType.CUSTOMER };
  }

  private signAccessToken(actor: TokenActor): { accessToken: string } {
    const payload: JwtPayload = {
      sub: actor.id,
      email: actor.email,
      tenantId: actor.tenantId,
      actorType: actor.actorType,
    };

    return { accessToken: this.jwtService.sign(payload) };
  }

  private signRefreshToken(actor: TokenActor): { refreshToken: string; tokenId: string } {
    const tokenId = randomUUID();

    const payload: RefreshTokenPayload = {
      id: actor.id,
      email: actor.email,
      tenantId: actor.tenantId,
      actorType: actor.actorType,
      jti: tokenId,
    };

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION_TIME_SECONDS'),
    });

    return { refreshToken, tokenId };
  }

  private refreshTokenExpiresAt(): Date {
    const seconds = this.configService.get('JWT_REFRESH_EXPIRATION_TIME_SECONDS');
    return new Date(Date.now() + seconds * 1000);
  }
}
