import { User } from 'src/modules/users/domain/entities/user.entity';

export abstract class UserValidator {
  abstract validateUser(email: string, password: string): Promise<User>;
}
