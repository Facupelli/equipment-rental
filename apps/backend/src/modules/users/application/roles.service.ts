import { Injectable } from '@nestjs/common';
import { Role } from '../domain/entities/role.entity';
import { randomUUID } from 'node:crypto';
import { RoleRepositoryPort } from './ports/role.repository.port';
import { RoleCommandPort } from './ports/role-command.port';

@Injectable()
export class RolesService implements RoleCommandPort {
  constructor(private readonly roleRepository: RoleRepositoryPort) {}

  async create(dto: { tenantId: string; name: string; description: string }): Promise<string> {
    const role = Role.create(randomUUID(), dto.tenantId, dto.name, dto.description);
    return this.roleRepository.save(role);
  }
}
