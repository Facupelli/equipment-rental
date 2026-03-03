import { Role } from '../domain/entities/role.entity';
import { User } from '../domain/entities/user.entity';

export abstract class UsersPublicApi {
  abstract findCredentialsByEmail(email: string): Promise<UserCredentials | null>;
  abstract isEmailTaken(email: string): Promise<boolean>;

  abstract create(dto: User): Promise<string>;
  abstract createRole(dto: Role): Promise<string>;
}

export interface UserCredentials {
  id: string;
  tenantId: string;
  email: string;
  passwordHash: string;
  isActive: boolean;

  // Nested structure to handle Location-specific roles
  roles: Array<{
    id: string;
  }>;
}
