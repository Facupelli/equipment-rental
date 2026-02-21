import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserValidator } from './domain/interfaces/user-validator.interface';
import { JwtPayload } from './strategies/jwt.strategy';
import { User } from '../users/domain/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
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
