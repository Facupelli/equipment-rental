import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Env } from 'src/config/env.schema';
import { TokenRepository } from '../repositories/token.repository';
import { ActorType } from '@repo/types';

export interface RefreshTokenPayload {
  id: string;
  email: string;
  tenantId: string;
  actorType: ActorType;
  jti: string;
}

export interface RefreshTokenUser {
  actorId: string;
  actorType: ActorType;
  tokenId: string;
}

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    configService: ConfigService<Env, true>,
    private readonly tokenRepository: TokenRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_REFRESH_SECRET'),
    });
  }

  async validate(payload: RefreshTokenPayload): Promise<RefreshTokenUser> {
    const tokenRecord = await this.tokenRepository.find(payload.jti, payload.actorType);

    if (!tokenRecord) {
      throw new UnauthorizedException('Refresh token not found.');
    }

    // ── Reuse Detection ─────────────────────────────────────────────────────
    // Revoked token being presented again signals a potential theft scenario.
    // Nuclear response: revoke ALL sessions for this actor and force re-login.
    if (tokenRecord.revokedAt !== null) {
      await this.tokenRepository.revokeAll(payload.id, payload.actorType);
      throw new UnauthorizedException('Refresh token reuse detected. All sessions invalidated.');
    }

    // ── Server-side Expiry Check ─────────────────────────────────────────────
    // Authoritative expiry lives in the DB — allows force-expiring tokens
    // server-side even before the JWT itself expires.
    if (tokenRecord.expiresAt < new Date()) {
      await this.tokenRepository.revokeOne(tokenRecord.id);
      throw new UnauthorizedException('Refresh token expired.');
    }

    return {
      actorId: payload.id,
      actorType: payload.actorType,
      tokenId: tokenRecord.id,
    };
  }
}
