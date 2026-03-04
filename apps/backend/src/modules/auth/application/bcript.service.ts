import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { QueryBus } from '@nestjs/cqrs';
import { FindCredentialsByEmailQuery } from 'src/modules/users/application/queries/find-credentials-by-email/find-credentials-by-email.query';
import { UserCredentials } from 'src/modules/users/application/queries/find-credentials-by-email/find-credentials-by-email.query-handerl';

@Injectable()
export class BcryptService {
  constructor(private readonly queryBus: QueryBus) {}

  async validateUser(email: string, pass: string): Promise<UserCredentials> {
    const user = await this.queryBus.execute<FindCredentialsByEmailQuery, UserCredentials | null>(
      new FindCredentialsByEmailQuery(email),
    );

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
