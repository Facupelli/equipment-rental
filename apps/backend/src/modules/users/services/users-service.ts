import { Injectable } from '@nestjs/common';
import { UserAuthPort } from 'src/modules/auth/interfaces/user-auth.interface';
import { User } from '../entities/user.entity';
import { UsersRepository } from '../users.repository';

@Injectable()
export class UsersService extends UserAuthPort {
  constructor(private readonly userRepository: UsersRepository) {
    super();
  }

  testMe() {
    return this.userRepository.findMany();
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findByEmail(email);
  }

  async save(user: User): Promise<string> {
    return await this.userRepository.save(user);
  }
}
