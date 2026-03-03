import { randomUUID } from 'crypto';
import { InvalidUserNameException } from '../expcetions/user.exceptions';
import { CreateUserRoleProps, UserRole } from './user-role.entity';
import { DuplicateRoleAssignmentException } from '../expcetions/role.exceptions';

export interface CreateUserProps {
  tenantId: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
}

export interface ReconstituteUserProps {
  id: string;
  tenantId: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  deletedAt: Date | null;
  userRoles: UserRole[];
}

export class User {
  private constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly email: string,
    private readonly passwordHash: string,
    public readonly firstName: string,
    public readonly lastName: string,
    private isActive: boolean,
    private deletedAt: Date | null,
    private userRoles: UserRole[],
  ) {}

  static create(props: CreateUserProps): User {
    if (!props.firstName || props.firstName.trim().length === 0) {
      throw new InvalidUserNameException('first');
    }
    if (!props.lastName || props.lastName.trim().length === 0) {
      throw new InvalidUserNameException('last');
    }
    return new User(
      randomUUID(),
      props.tenantId,
      props.email,
      props.passwordHash,
      props.firstName.trim(),
      props.lastName.trim(),
      true,
      null,
      [],
    );
  }

  static reconstitute(props: ReconstituteUserProps): User {
    return new User(
      props.id,
      props.tenantId,
      props.email,
      props.passwordHash,
      props.firstName,
      props.lastName,
      props.isActive,
      props.deletedAt,
      props.userRoles,
    );
  }

  get roles(): UserRole[] {
    // Return a copy to prevent external mutation
    return [...this.userRoles];
  }

  get active(): boolean {
    return this.isActive;
  }

  get deleted(): boolean {
    return this.deletedAt !== null;
  }

  get deletedOn(): Date | null {
    return this.deletedAt;
  }

  get currentPasswordHash(): string {
    return this.passwordHash;
  }

  assignRole(props: CreateUserRoleProps): void {
    if (!this.isActive) {
      throw new Error('Cannot assign roles to an inactive user.');
    }

    const isDuplicate = this.userRoles.some(
      (ur) => ur.roleId === props.roleId && ur.locationId === (props.locationId ?? null),
    );

    if (isDuplicate) {
      throw new DuplicateRoleAssignmentException();
    }

    const userRole = UserRole.create({
      ...props,
      userId: this.id,
    });

    this.userRoles.push(userRole);
  }

  removeRole(roleId: string, locationId?: string): void {
    const index = this.userRoles.findIndex((ur) => ur.roleId === roleId && ur.locationId === (locationId ?? null));

    if (index === -1) {
      throw new Error('Role assignment not found.');
    }

    this.userRoles.splice(index, 1);
  }

  deactivate(): void {
    this.isActive = false;
  }

  softDelete(): void {
    this.deletedAt = new Date();
    this.isActive = false;
  }
}
