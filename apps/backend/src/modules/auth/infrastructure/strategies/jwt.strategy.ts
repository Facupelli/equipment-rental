import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from 'src/config/env.schema';
import { LogContext } from 'src/core/logger/log-context';
import { ActorType } from '@repo/types';

export interface JwtPayload {
  sub: string;
  email: string;
  tenantId: string;
  actorType: ActorType;
  iat?: number;
  exp?: number;
}

export interface ReqUser {
  id: string;
  email: string;
  tenantId: string;
  actorType: ActorType;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(readonly configService: ConfigService<Env, true>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<ReqUser> {
    LogContext.set('userId', payload.sub);

    return {
      id: payload.sub,
      email: payload.email,
      tenantId: payload.tenantId,
      actorType: payload.actorType,
    };
  }
}
