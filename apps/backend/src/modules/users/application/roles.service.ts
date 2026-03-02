import { Injectable } from '@nestjs/common';
import { Role } from '../domain/entities/role.entity';
import { randomUUID } from 'node:crypto';
import { RoleRepositoryPort } from '../domain/ports/role.repository.port';

@Injectable()
export class RolesService {
  constructor(private readonly roleRepository: RoleRepositoryPort) {}

  async create(dto: { tenantId: string; name: string; description: string }): Promise<string> {
    const role = Role.create(randomUUID(), dto.tenantId, dto.name, dto.description);
    return this.roleRepository.save(role);
  }
}
