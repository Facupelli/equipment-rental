import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserValidator } from '../domain/port/user-validator.port';
import { User } from 'src/modules/users/domain/entities/user.entity';
import { JwtPayload } from '../infrastructure/strategies/jwt.strategy';
import { randomUUID } from 'node:crypto';
import { RefreshTokenPayload } from '../infrastructure/strategies/jwt-refresh.strategy';
import { ConfigService } from '@nestjs/config';
import { Env } from 'src/config/env.schema';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/core/database/prisma.service';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userValidator: UserValidator,
    private readonly configService: ConfigService<Env, true>,
    private readonly prisma: PrismaService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    return await this.userValidator.validateUser(email, pass);
  }

  // async login(user: User) {
  //   const payload: JwtPayload = {
  //     sub: user.id,
  //     email: user.email,
  //     tenantId: user.tenantId,
  //     roleId: user.roleId,
  //   };

  //   return {
  //     access_token: this.jwtService.sign(payload),
  //   };
  // }

  // Issues both tokens. The access token is returned in the response body.
  // The refresh token is returned raw so the controller can set it as a cookie.
  async login(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    const { accessToken } = this.signAccessToken(user);
    const { refreshToken, tokenId } = this.signRefreshToken(user);

    await this.storeRefreshToken(tokenId, user.id, refreshToken);

    return { accessToken, refreshToken };
  }

  // ── Refresh ───────────────────────────────────────────────────────────────
  // Rotates the refresh token atomically. The old token is revoked and a new
  // one is issued — both inside a single Prisma transaction to prevent any
  // state where the old token is revoked but the new one wasn't created.
  async refreshTokens(userId: string, oldTokenId: string): Promise<{ accessToken: string; refreshToken: string }> {
    // Fetch the user to sign fresh tokens with up-to-date claims.
    const user = await this.prisma.client.user.findUniqueOrThrow({
      where: { id: userId },
    });

    const { accessToken } = this.signAccessToken(user);
    const { refreshToken, tokenId: newTokenId } = this.signRefreshToken(user);

    const expiresAt = this.refreshTokenExpiresAt();
    const tokenHash = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);

    // Atomic: revoke old token + insert new token in one transaction.
    // If the INSERT fails, the UPDATE rolls back — client can retry with the old token.
    await this.prisma.client.$transaction([
      this.prisma.client.refreshToken.update({
        where: { id: oldTokenId },
        data: { revokedAt: new Date() },
      }),
      this.prisma.client.refreshToken.create({
        data: {
          id: newTokenId,
          tokenHash,
          userId,
          expiresAt,
        },
      }),
    ]);

    return { accessToken, refreshToken };
  }

  // Revokes all refresh tokens for the user — logs out all devices.
  async logout(userId: string): Promise<void> {
    await this.prisma.client.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null, // only touch still-active tokens
      },
      data: { revokedAt: new Date() },
    });
  }

  // -----------------------------------------------------------------------------

  private signAccessToken(user: Pick<User, 'id' | 'email' | 'tenantId' | 'roleId'>): {
    accessToken: string;
  } {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      roleId: user.roleId,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      // Uses the default secret + expiry from JwtModule.registerAsync config.
    };
  }

  private signRefreshToken(user: Pick<User, 'id' | 'email' | 'tenantId' | 'roleId'>): {
    refreshToken: string;
    tokenId: string;
  } {
    const tokenId = randomUUID();

    const payload: RefreshTokenPayload = {
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      roleId: user.roleId,
      jti: tokenId,
    };

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION_TIME_SECONDS'),
    });

    return { refreshToken, tokenId };
  }

  private async storeRefreshToken(tokenId: string, userId: string, rawToken: string): Promise<void> {
    const tokenHash = await bcrypt.hash(rawToken, BCRYPT_ROUNDS);
    const expiresAt = this.refreshTokenExpiresAt();

    await this.prisma.client.refreshToken.create({
      data: {
        id: tokenId,
        tokenHash,
        userId,
        expiresAt,
      },
    });
  }

  private refreshTokenExpiresAt(): Date {
    const seconds = this.configService.get('JWT_REFRESH_EXPIRATION_TIME_SECONDS');
    return new Date(Date.now() + seconds * 1000);
  }
}
