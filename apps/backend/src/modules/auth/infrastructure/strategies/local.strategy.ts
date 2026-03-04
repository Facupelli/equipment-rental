import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { BcryptService } from '../../application/bcript.service';
import { UserCredentials } from 'src/modules/users/application/users-public-api';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private bcryptService: BcryptService) {
    super({
      usernameField: 'email',
    });
  }

  async validate(email: string, password: string): Promise<UserCredentials> {
    const user = await this.bcryptService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
