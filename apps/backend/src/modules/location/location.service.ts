import { BadRequestException, Injectable } from '@nestjs/common';
import { LocationRepositoryPort } from './ports/location.repository';
import { Location } from './entities/location.entity';
import { CreateLocationDto } from '@repo/schemas';
import { TenantContextService } from '../tenancy/tenant-context.service';

@Injectable()
export class LocationService {
  constructor(
    private readonly locationRepository: LocationRepositoryPort,
    private readonly tenantContext: TenantContextService,
  ) {}

  async create(dto: CreateLocationDto) {
    const tenantId = this.tenantContext.getTenantId();

    if (tenantId === undefined) {
      throw new BadRequestException(
        'No tenant context found. Ensure the request passed through TenantMiddleware, or use `prismaService` directly for system-level operations.',
      );
    }

    const location = Location.create(dto.name, dto.address, tenantId);
    return await this.locationRepository.save(location);
  }

  async findById(id: string): Promise<Location | null> {
    return await this.locationRepository.findOne(id);
  }
}
