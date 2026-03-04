import { Tenant } from '../entities/tenant.entity';

export abstract class TenantRepositoryPort {
  abstract load(id: string): Promise<Tenant | null>;
  abstract save(user: Tenant): Promise<string>;
}
