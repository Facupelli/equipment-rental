import { Role } from '../entities/role.entity';

export abstract class RoleRepositoryPort {
  abstract load(id: string): Promise<Role | null>;
  abstract save(role: Role): Promise<string>;
}
