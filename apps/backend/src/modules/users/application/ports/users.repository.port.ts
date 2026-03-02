import { User } from '../../domain/entities/user.entity';

export abstract class UsersRepositoryPort {
  abstract load(id: string): Promise<User | null>;
  abstract save(user: User): Promise<string>;

  abstract isEmailTaken(email: string): Promise<boolean>;
}
