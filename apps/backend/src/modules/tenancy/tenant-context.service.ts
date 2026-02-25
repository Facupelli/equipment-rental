import { AsyncLocalStorage } from 'async_hooks';

interface TenantStore {
  tenantId: string;
}

export class TenantContextService {
  private readonly als = new AsyncLocalStorage<TenantStore>();

  run(tenantId: string, callback: () => void) {
    this.als.run({ tenantId }, callback);
  }

  getTenantId(): string {
    const store = this.als.getStore();

    const tenantId = store?.tenantId;

    if (!tenantId) {
      throw new Error('No tenant ID found in context.');
    }

    return tenantId;
  }
}
