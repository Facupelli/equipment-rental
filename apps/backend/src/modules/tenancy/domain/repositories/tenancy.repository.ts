import { Tenant } from '../entities/tenant.entity';

export abstract class TenancyRepository {
  abstract findById(id: string): Promise<Tenant | null>;
  abstract findBySlug(slug: string): Promise<Tenant | null>;
  abstract save(user: Tenant): Promise<string>;
}
