import { PrismaTransactionClient } from 'src/core/database/prisma-unit-of-work';

export abstract class UsersPublicApi {
  abstract create(dto: UserDto): Promise<string>;
  abstract createRole(dto: RoleDto): Promise<string>;
  abstract createTenantAdmin(dto: CreateTenantAdminDto, tx?: PrismaTransactionClient): Promise<CreateTenantAdminResult>;
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

export interface CreateTenantAdminDto {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  tenantId: string;
  roleCode: string;
  roleName: string;
  roleDescription?: string;
}

export interface CreateTenantAdminResult {
  roleId: string;
  userId: string;
}
