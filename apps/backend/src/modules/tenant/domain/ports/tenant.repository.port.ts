import { Tenant } from '../entities/tenant.entity';

export abstract class TenantRepositoryPort {
  abstract load(id: string): Promise<Tenant | null>;
  abstract save(user: Tenant): Promise<string>;
}

export abstract class TenantReadService {
  abstract isSlugTaken(slug: string): Promise<boolean>;
  abstract findById(id: string): Promise<any | null>;
}
