import { BadRequestException } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

interface TenantStore {
  tenantId: string;
}

export class TenantContextService {
  private readonly als = new AsyncLocalStorage<TenantStore>();

  run(tenantId: string, callback: () => void) {
    this.als.run({ tenantId }, callback);
  }

  requireTenantId(): string {
    const store = this.als.getStore();
    const tenantId = store?.tenantId;

    if (!tenantId) {
      throw new BadRequestException(
        'No tenant context found. Ensure the request passed through TenantMiddleware, or use `prismaService` directly for system-level operations.',
      );
    }

    return tenantId;
  }

  getTenantId(): string | undefined {
    const store = this.als.getStore();
    const tenantId = store?.tenantId;

    return tenantId;
  }
}
