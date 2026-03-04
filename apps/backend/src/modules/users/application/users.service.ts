import { Injectable } from '@nestjs/common';
import { RoleDto, UserDto, UsersPublicApi } from './users-public-api';
import { UserRepositoryPort } from '../domain/ports/user.repository.port';
import { User } from '../domain/entities/user.entity';
import { Role } from '../domain/entities/role.entity';
import { RoleRepositoryPort } from '../domain/ports/role.repository.port';

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
}
