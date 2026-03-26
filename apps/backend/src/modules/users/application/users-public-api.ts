export abstract class UsersPublicApi {
  abstract create(dto: UserDto): Promise<string>;
  abstract createRole(dto: RoleDto): Promise<string>;
}

export interface UserDto {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  tenantId: string;
  roleId: string;
}

export interface RoleDto {
  code: string;
  name: string;
  description?: string;
  tenantId: string;
}
