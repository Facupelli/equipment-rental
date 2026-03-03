import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserCredentials, UsersPublicApi } from '../../users/application/users-public-api';

@Injectable()
export class BcryptService {
  constructor(private readonly usersApi: UsersPublicApi) {}

  async validateUser(email: string, pass: string): Promise<UserCredentials> {
    const user = await this.usersApi.findCredentialsByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    return hashedPassword;
  }
}
