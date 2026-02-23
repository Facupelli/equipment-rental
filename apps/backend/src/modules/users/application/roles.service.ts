import { Injectable } from '@nestjs/common';
import { Role } from '../domain/entities/role.entity';
import { RoleRepository } from '../domain/repositories/role.repository';
import { randomUUID } from 'node:crypto';

@Injectable()
export class RolesService {
  constructor(private readonly roleRepository: RoleRepository) {}

  async create(dto: { tenantId: string; name: string; description: string }): Promise<string> {
    const role = Role.create(randomUUID(), dto.tenantId, dto.name, dto.description);
    return this.roleRepository.save(role);
  }
}
