import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { ActorType } from '@repo/types';
import { BcryptService } from '../../application/bcript.service';
import { UserCredentialsReadModel } from 'src/modules/users/public/read-models/user-credentials.read-model';
import { Request } from 'express';

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

  async validate(_: Request, email: string, password: string): Promise<UserLocalUser> {
    const user: UserCredentialsReadModel = await this.bcryptService.validateUser(email, password);

    return {
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      actorType: ActorType.USER,
    };
  }
}
