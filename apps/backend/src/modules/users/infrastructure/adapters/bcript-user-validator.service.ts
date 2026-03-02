import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserValidator } from 'src/modules/auth/domain/port/user-validator.port';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from '../../domain/ports/users.repository.port';

@Injectable()
export class BcryptUserValidator extends UserValidator {
  constructor(private readonly repo: UsersRepository) {
    super();
  }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.repo.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }
}
