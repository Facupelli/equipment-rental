import { randomUUID } from 'crypto';

export interface CreateUserRoleProps {
  userId: string;
  roleId: string;
  locationId?: string;
}

export interface ReconstituteUserRoleProps {
  id: string;
  userId: string;
  roleId: string;
  locationId: string | null;
}

export class UserRole {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly roleId: string,
    public readonly locationId: string | null,
  ) {}

  static create(props: CreateUserRoleProps): UserRole {
    return new UserRole(randomUUID(), props.userId, props.roleId, props.locationId ?? null);
  }

  static reconstitute(props: ReconstituteUserRoleProps): UserRole {
    return new UserRole(props.id, props.userId, props.roleId, props.locationId);
  }

  isScopedToLocation(): boolean {
    return this.locationId !== null;
  }
}
