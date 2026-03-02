import { Injectable } from '@nestjs/common';
import { CreateOwnerDto } from '@repo/schemas';
import { TenantContextService } from '../tenancy/tenant-context.service';
import { Owner } from './domain/entities/owner.entity';
import { OwnerRepositoryPort } from './application/ports/owner-repository.port';

@Injectable()
export class OwnerService {
  constructor(
    private readonly ownerRepository: OwnerRepositoryPort,
    private readonly tenantContext: TenantContextService,
  ) {}

  async create(dto: CreateOwnerDto) {
    const tenantId = this.tenantContext.requireTenantId();

    const owner = Owner.create(dto.name, tenantId);
    return await this.ownerRepository.save(owner);
  }

  async findById(id: string): Promise<Owner | null> {
    return await this.ownerRepository.findOne(id);
  }

  async findAll(): Promise<Owner[]> {
    return await this.ownerRepository.findAll();
  }
}
