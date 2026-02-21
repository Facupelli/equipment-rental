import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserValidator } from './interfaces/user-validator.interface';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private readonly userValidator: UserValidator,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    return await this.userValidator.validateUser(email, pass);
  }

  async login(user: any) {
    // The payload is CRITICAL. This is what ends up inside the JWT string.
    // We include tenantId and role so we don't have to query the DB on every request.
    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
