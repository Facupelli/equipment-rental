import { Injectable } from '@nestjs/common';
import { TenancyRepositoryPort } from '../domain/ports/tenancy.repository.port';
import { Tenant } from '../domain/entities/tenant.entity';

@Injectable()
export class TenancyService {
  constructor(private readonly tenancyRepository: TenancyRepositoryPort) {}

  async findById(id: string): Promise<Tenant | null> {
    return await this.tenancyRepository.load(id);
  }
}
