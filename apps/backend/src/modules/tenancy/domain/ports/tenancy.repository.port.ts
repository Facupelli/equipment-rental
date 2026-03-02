import { Tenant } from '../entities/tenant.entity';

export abstract class TenancyRepositoryPort {
  abstract load(id: string): Promise<Tenant | null>;
  abstract save(user: Tenant): Promise<string>;

  abstract isSlugTaken(slug: string): Promise<boolean>;
}
