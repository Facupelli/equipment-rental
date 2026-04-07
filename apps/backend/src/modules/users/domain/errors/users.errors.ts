import { Permission } from '@repo/types';
import { DomainError } from 'src/core/exceptions/domain.error';

export class UsersError extends DomainError {}

export class UserInactiveError extends UsersError {
  constructor(userId: string) {
    super(`User '${userId}' is inactive and cannot receive role assignments.`);
  }
}

export class DuplicateRoleAssignmentError extends UsersError {
  constructor(userId: string, roleId: string, locationId: string | null) {
    super(`User '${userId}' already has role '${roleId}' assigned for location '${locationId ?? 'global'}'.`);
  }
}

export class RoleAssignmentNotFoundError extends UsersError {
  constructor(userId: string, roleId: string, locationId: string | null) {
    super(`Role assignment '${roleId}' for user '${userId}' and location '${locationId ?? 'global'}' was not found.`);
  }
}

export class DuplicateRolePermissionError extends UsersError {
  constructor(roleId: string, permission: Permission) {
    super(`Permission '${permission}' is already assigned to role '${roleId}'.`);
  }
}

export class RolePermissionNotFoundError extends UsersError {
  constructor(roleId: string, permission: Permission) {
    super(`Permission '${permission}' is not assigned to role '${roleId}'.`);
  }
}

export class InvitationAlreadyAcceptedError extends UsersError {
  constructor(invitationId: string) {
    super(`Invitation '${invitationId}' has already been accepted.`);
  }
}

export class InvitationExpiredError extends UsersError {
  constructor(invitationId: string) {
    super(`Invitation '${invitationId}' has expired.`);
  }
}

export class UserNotFoundError extends UsersError {
  constructor(userId: string, tenantId: string) {
    super(`User '${userId}' was not found in tenant '${tenantId}'.`);
  }
}

export class UserProfileAlreadyExistsError extends UsersError {
  constructor(userId: string) {
    super(`User '${userId}' already has a profile.`);
  }
}

export class UserProfileNotFoundError extends UsersError {
  constructor(userId: string) {
    super(`User profile for user '${userId}' was not found.`);
  }
}

export class UserIsNotTenantAdminError extends UsersError {
  constructor(userId: string, tenantId: string) {
    super(`User '${userId}' is not the tenant admin for tenant '${tenantId}'.`);
  }
}
