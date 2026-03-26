import { Permission } from '@repo/types';

export class InvalidRoleNameException extends Error {
  constructor() {
    super('Role name cannot be empty.');
    this.name = 'InvalidRoleNameException';
  }
}

export class InvalidRoleCodeException extends Error {
  constructor() {
    super('Role code cannot be empty.');
    this.name = 'InvalidRoleCodeException';
  }
}

export class DuplicateRolePermissionException extends Error {
  constructor(permission: Permission) {
    super(`Permission '${permission}' is already assigned to this role.`);
    this.name = 'DuplicateRolePermissionException';
  }
}

export class RolePermissionNotFoundException extends Error {
  constructor(permission: Permission) {
    super(`Permission '${permission}' is not assigned to this role.`);
    this.name = 'RolePermissionNotFoundException';
  }
}

export class DuplicateRoleAssignmentException extends Error {
  constructor() {
    super('Role assignment already exists for this user.');
    this.name = 'DuplicateRoleAssignmentException';
  }
}
