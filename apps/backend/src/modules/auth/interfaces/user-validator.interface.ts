import { User } from 'src/users/entities/user.entity';

export abstract class UserValidator {
  abstract validateUser(email: string, password: string): Promise<User>;
}
