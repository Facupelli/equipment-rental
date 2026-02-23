import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { User } from 'src/modules/users/domain/entities/user.entity';
import { UserValidator } from '../../domain/port/user-validator.port';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private userValidator: UserValidator) {
    super({
      usernameField: 'email',
    });
  }

  async validate(email: string, password: string): Promise<User> {
    const user = await this.userValidator.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
