import { Injectable } from '@nestjs/common';
import { TenancyRepository } from '../domain/repositories/tenancy.repository';
import { Tenant } from '../domain/entities/tenant.entity';

@Injectable()
export class TenancyService {
  constructor(private readonly tenancyRepository: TenancyRepository) {}

  async findById(id: string): Promise<Tenant | null> {
    return await this.tenancyRepository.findById(id);
  }
}
