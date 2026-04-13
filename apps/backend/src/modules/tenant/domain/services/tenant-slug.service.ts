import { err, ok, Result } from 'neverthrow';

import { ReservedTenantSlugError } from '../errors/tenant.errors';
import { BANNED_TENANT_SLUGS } from '../tenant.constants';

export class TenantSlugService {
  static createFromName(name: string): Result<string, ReservedTenantSlugError> {
    const slug = name
      .toLowerCase()
      .trim()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (BANNED_TENANT_SLUGS.includes(slug)) {
      return err(new ReservedTenantSlugError(slug));
    }

    return ok(slug);
  }
}
