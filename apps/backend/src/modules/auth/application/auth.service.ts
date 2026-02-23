import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserValidator } from '../domain/port/user-validator.port';
import { User } from 'src/modules/users/domain/entities/user.entity';
import { JwtPayload } from '../infrastructure/strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userValidator: UserValidator,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    return await this.userValidator.validateUser(email, pass);
  }

  async login(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      roleId: user.roleId,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
