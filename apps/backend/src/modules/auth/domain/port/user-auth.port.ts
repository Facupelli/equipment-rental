import { User } from 'src/modules/users/domain/entities/user.entity';

export abstract class UserAuthPort {
  abstract findByEmail(email: string): Promise<User | null>;
}
