import { Role } from '../entities/role.entity';

export abstract class RoleRepository {
  /**
   * Finds a role by id, scoped to a specific tenant.
   * Returns null if the role does not exist or belongs to a different tenant.
   */
  abstract findByIdAndTenantId(id: string, tenantId: string): Promise<Role | null>;
  abstract save(role: Role): Promise<string>;
}
