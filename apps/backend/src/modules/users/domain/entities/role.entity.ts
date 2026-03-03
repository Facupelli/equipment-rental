import { Permission } from '@repo/types';
import { randomUUID } from 'crypto';
import {
  DuplicateRolePermissionException,
  InvalidRoleNameException,
  RolePermissionNotFoundException,
} from '../expcetions/role.exceptions';

// ---------------------------------------------------------------------------
// RolePermission
// ---------------------------------------------------------------------------

export interface CreateRolePermissionProps {
  roleId: string;
  permission: Permission;
}

export interface ReconstituteRolePermissionProps {
  id: string;
  roleId: string;
  permission: Permission;
}

export class RolePermission {
  private constructor(
    public readonly id: string,
    public readonly roleId: string,
    public readonly permission: Permission,
  ) {}

  static create(props: CreateRolePermissionProps): RolePermission {
    return new RolePermission(randomUUID(), props.roleId, props.permission);
  }

  static reconstitute(props: ReconstituteRolePermissionProps): RolePermission {
    return new RolePermission(props.id, props.roleId, props.permission);
  }
}

// ---------------------------------------------------------------------------
// Role
// ---------------------------------------------------------------------------

export interface CreateRoleProps {
  tenantId: string;
  name: string;
  description?: string;
  isDefault?: boolean;
}

export interface ReconstituteRoleProps {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  permissions: RolePermission[];
}

export class Role {
  private constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly name: string,
    private description: string | null,
    private isDefault: boolean,
    private readonly permissions: RolePermission[],
  ) {}

  static create(props: CreateRoleProps): Role {
    if (!props.name || props.name.trim().length === 0) {
      throw new InvalidRoleNameException();
    }
    return new Role(
      randomUUID(),
      props.tenantId,
      props.name.trim(),
      props.description?.trim() ?? null,
      props.isDefault ?? false,
      [],
    );
  }

  static reconstitute(props: ReconstituteRoleProps): Role {
    return new Role(props.id, props.tenantId, props.name, props.description, props.isDefault, props.permissions);
  }

  get currentDescription(): string | null {
    return this.description;
  }

  get default(): boolean {
    return this.isDefault;
  }

  getPermissions(): RolePermission[] {
    return [...this.permissions];
  }

  updateDescription(description: string | null): void {
    this.description = description?.trim() ?? null;
  }

  setAsDefault(): void {
    this.isDefault = true;
  }

  unsetAsDefault(): void {
    this.isDefault = false;
  }

  addPermission(permission: Permission): void {
    const duplicate = this.permissions.some((p) => p.permission === permission);
    if (duplicate) {
      throw new DuplicateRolePermissionException(permission);
    }
    const rolePermission = RolePermission.create({ roleId: this.id, permission });
    this.permissions.push(rolePermission);
  }

  removePermission(permission: Permission): void {
    const idx = this.permissions.findIndex((p) => p.permission === permission);
    if (idx === -1) {
      throw new RolePermissionNotFoundException(permission);
    }
    this.permissions.splice(idx, 1);
  }

  hasPermission(permission: Permission): boolean {
    return this.permissions.some((p) => p.permission === permission);
  }
}
