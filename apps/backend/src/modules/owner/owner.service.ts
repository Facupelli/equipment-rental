import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateOwnerDto } from '@repo/schemas';
import { TenantContextService } from '../tenancy/tenant-context.service';
import { OwnerRepositoryPort } from './ports/owner-repository.port';
import { Owner } from './entities/owner.entity';

@Injectable()
export class OwnerService {
  constructor(
    private readonly ownerRepository: OwnerRepositoryPort,
    private readonly tenantContext: TenantContextService,
  ) {}

  async create(dto: CreateOwnerDto) {
    const tenantId = this.tenantContext.getTenantId();

    if (tenantId === undefined) {
      throw new BadRequestException(
        'No tenant context found. Ensure the request passed through TenantMiddleware, or use `prismaService` directly for system-level operations.',
      );
    }

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
