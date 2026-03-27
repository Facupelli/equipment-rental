import { Injectable } from '@nestjs/common';
import { CreateTenantAdminDto, CreateTenantAdminResult, RoleDto, UserDto, UsersPublicApi } from './users-public-api';
import { UserRepositoryPort } from '../domain/ports/user.repository.port';
import { User } from '../domain/entities/user.entity';
import { Role } from '../domain/entities/role.entity';
import { RoleRepositoryPort } from '../domain/ports/role.repository.port';
import { PrismaTransactionClient } from 'src/core/database/prisma-unit-of-work';
import { TENANT_ADMIN_PERMISSIONS } from '../domain/tenant-admin.permissions';
import { RoleRepository } from '../infrastructure/persistence/repositories/role.repository';
import { UserRepository } from '../infrastructure/persistence/repositories/user.repository';

@Injectable()
export class UsersService implements UsersPublicApi {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly roleRepository: RoleRepositoryPort,
  ) {}

  // PUBLIC API
  async create(dto: UserDto): Promise<string> {
    const user = User.create({
      email: dto.email,
      passwordHash: dto.passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      tenantId: dto.tenantId,
    });

    user.assignRole({
      roleId: dto.roleId,
      userId: user.id,
    });

    return await this.userRepository.save(user);
  }

  async createRole(dto: RoleDto): Promise<string> {
    const role = Role.create(dto);

    return await this.roleRepository.save(role);
  }

  async createTenantAdmin(dto: CreateTenantAdminDto, tx?: PrismaTransactionClient): Promise<CreateTenantAdminResult> {
    const roleRepository = tx ? new RoleRepository(tx) : null;
    const userRepository = tx ? new UserRepository(tx) : null;

    const role = Role.create({
      code: dto.roleCode,
      name: dto.roleName,
      description: dto.roleDescription,
      tenantId: dto.tenantId,
    });

    for (const permission of TENANT_ADMIN_PERMISSIONS) {
      role.addPermission(permission);
    }

    if (roleRepository) {
      await roleRepository.save(role);
    } else {
      await this.roleRepository.save(role);
    }

    const user = User.create({
      email: dto.email,
      passwordHash: dto.passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      tenantId: dto.tenantId,
    });

    user.assignRole({
      userId: user.id,
      roleId: role.id,
    });

    if (userRepository) {
      await userRepository.save(user);
    } else {
      await this.userRepository.save(user);
    }

    return {
      roleId: role.id,
      userId: user.id,
    };
  }
}
