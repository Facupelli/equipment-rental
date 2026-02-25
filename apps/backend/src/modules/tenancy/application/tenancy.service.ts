import { ConflictException, Injectable } from '@nestjs/common';
import { TenancyRepository } from '../domain/repositories/tenancy.repository';
import { Tenant } from '../domain/entities/tenant.entity';
import { CreateTenantUserDto } from '@repo/schemas';
import { randomUUID } from 'node:crypto';

@Injectable()
export class TenancyService {
  constructor(private readonly tenancyRepository: TenancyRepository) {}

  async findById(id: string): Promise<Tenant | null> {
    return await this.tenancyRepository.findById(id);
  }

  async create(dto: CreateTenantUserDto): Promise<string> {
    const slugTaken = await this.tenancyRepository.findBySlug(dto.companySlug);
    if (slugTaken) {
      throw new ConflictException('Company slug already in use');
    }

    const tenant = Tenant.create(randomUUID(), dto.companyName, dto.companySlug, 'starter');
    const tenantId = await this.tenancyRepository.save(tenant);

    return tenantId;
  }
}
