import { User } from './entities/user.entity';

export abstract class UserRepository {
  abstract findById(id: string): Promise<User | null>;

  // generic find for lists or flexible queries
  // abstract find(query: UserQuery): Promise<User[]>;

  abstract findByEmail(email: string): Promise<User | null>;

  abstract save(user: User): Promise<void>;
}
