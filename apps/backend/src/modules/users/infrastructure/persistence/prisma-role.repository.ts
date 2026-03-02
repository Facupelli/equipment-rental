import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { Role } from '../../domain/entities/role.entity';
import { RoleMapper } from './role.mapper';
import { RoleRepositoryPort } from '../../application/ports/role.repository.port';

@Injectable()
export class PrismaRoleRepository implements RoleRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async load(id: string): Promise<Role | null> {
    const raw = await this.prisma.client.role.findFirst({
      where: { id },
    });

    return raw ? RoleMapper.toDomain(raw) : null;
  }

  async save(role: Role): Promise<string> {
    const data = RoleMapper.toPersistence(role);

    const result = await this.prisma.client.role.upsert({
      where: { id: role.id, tenantId: role.tenantId },
      create: data,
      update: data,
    });

    return result.id;
  }
}
