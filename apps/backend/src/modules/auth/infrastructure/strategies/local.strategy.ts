import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { Request } from 'express';
import { ActorType } from '@repo/types';
import { BcryptService } from '../../application/bcript.service';
import { UserCredentials } from 'src/modules/users/application/queries/find-credentials-by-email/find-credentials-by-email.types';

export interface UserLocalUser {
  id: string;
  email: string;
  tenantId: string;
  actorType: ActorType.USER;
}

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private bcryptService: BcryptService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true,
    });
  }

  async validate(req: Request, email: string, password: string): Promise<UserLocalUser> {
    const tenantId = req.body.tenantId as string | undefined;

    if (!tenantId) {
      throw new UnauthorizedException('tenantId is required.');
    }

    const user: UserCredentials = await this.bcryptService.validateUser(email, password, tenantId);

    return {
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      actorType: ActorType.USER,
    };
  }
}
