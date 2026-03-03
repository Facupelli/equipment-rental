import { MeResponseDto } from '@repo/schemas';
import { UserCredentials } from '../../application/users-public-api';
import { User } from '../entities/user.entity';

export abstract class UserRepositoryPort {
  abstract load(id: string): Promise<User | null>;
  abstract save(user: User): Promise<string>;
}

export abstract class UserReadService {
  abstract findById(id: string): Promise<MeResponseDto | null>;
  abstract findCredentialsByEmail(email: string): Promise<UserCredentials | null>;
  abstract isEmailTaken(email: string): Promise<boolean>;
}
