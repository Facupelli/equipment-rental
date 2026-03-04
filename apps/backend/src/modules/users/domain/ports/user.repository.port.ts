import { User } from '../entities/user.entity';

export abstract class UserRepositoryPort {
  abstract load(id: string): Promise<User | null>;
  abstract save(user: User): Promise<string>;
}
