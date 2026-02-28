import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { Env } from 'src/config/env.schema';
import { PrismaService } from 'src/core/database/prisma.service';

// Refresh token payload — signed with a different secret than the access token.
// jti (JWT ID) is the DB row id, so we can locate and rotate the exact token.
export interface RefreshTokenPayload {
  id: string; // userId
  email: string;
  tenantId: string;
  roleId: string;
  jti: string; // RefreshToken.id in the DB
}

// What Passport attaches to req.user after refresh token validation.
export interface RefreshTokenUser {
  userId: string;
  tokenId: string; // the DB row id (jti) — needed by the rotation transaction
}

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    configService: ConfigService<Env, true>,
    private readonly prisma: PrismaService,
  ) {
    super({
      // Extract the raw JWT from the httpOnly cookie named 'refresh_token'.
      jwtFromRequest: ExtractJwt.fromExtractors([(req: Request) => req?.cookies?.['refresh_token'] ?? null]),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_REFRESH_SECRET'),
      // passReqToCallback is NOT needed here — we read the cookie via the
      // extractor above, and the raw token is available in validate() via
      // the decoded payload's jti. We fetch from DB using jti directly.
    });
  }

  async validate(payload: RefreshTokenPayload): Promise<RefreshTokenUser> {
    const tokenRecord = await this.prisma.client.refreshToken.findUnique({
      where: { id: payload.jti },
    });

    // Token row doesn't exist at all — invalid or already cleaned up.
    if (!tokenRecord) {
      throw new UnauthorizedException('Refresh token not found.');
    }

    // ── Reuse Detection ─────────────────────────────────────────────────────
    // If this token was already revoked and someone is presenting it again,
    // we have a potential theft scenario. Nuclear response: revoke ALL sessions
    // for this user and force a full re-login.
    if (tokenRecord.revokedAt !== null) {
      await this.prisma.client.refreshToken.updateMany({
        where: { userId: payload.id },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Refresh token reuse detected. All sessions invalidated.');
    }

    // ── Server-side Expiry Check ─────────────────────────────────────────────
    // The JWT expiry is a first pass. We also check our own DB expiry as the
    // authoritative source — this allows us to force-expire tokens server-side
    // even if the JWT hasn't expired yet (e.g. forced logout, security incident).
    if (tokenRecord.expiresAt < new Date()) {
      await this.prisma.client.refreshToken.update({
        where: { id: tokenRecord.id },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Refresh token expired.');
    }

    // All checks passed. Attach minimal info to req.user for the controller.
    return {
      userId: payload.id,
      tokenId: tokenRecord.id,
    };
  }
}
