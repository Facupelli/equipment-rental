import { Injectable } from '@nestjs/common';
import { Role } from '../domain/entities/role.entity';
import { RoleRepository } from '../domain/repositories/role.repository';

@Injectable()
export class RolesService {
  constructor(private readonly roleRepository: RoleRepository) {}

  async save(role: Role): Promise<string> {
    return this.roleRepository.save(role);
  }
}
