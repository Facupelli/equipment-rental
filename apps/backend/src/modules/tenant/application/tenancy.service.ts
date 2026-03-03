import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantResponseDto } from '@repo/schemas';
import { TenantReadService } from '../domain/ports/tenant.repository.port';

@Injectable()
export class TenancyService {
  constructor(private readonly readService: TenantReadService) {}

  async findById(id: string): Promise<TenantResponseDto> {
    const tenant = await this.readService.findById(id);

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }
}
