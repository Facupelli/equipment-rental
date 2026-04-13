import { ReservedTenantSlugError } from '../errors/tenant.errors';
import { TenantSlugService } from './tenant-slug.service';

describe('TenantSlugService', () => {
  it('creates a normalized slug from a company name', () => {
    const result = TenantSlugService.createFromName('  Acme Rentals  ');

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toBe('acme-rentals');
  });

  it('rejects names that normalize to a reserved slug', () => {
    const result = TenantSlugService.createFromName('Admin');

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(ReservedTenantSlugError);
    expect(result._unsafeUnwrapErr().message).toContain("'admin'");
  });
});
