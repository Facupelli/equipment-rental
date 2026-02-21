import { AsyncLocalStorage } from 'async_hooks';

interface TenantStore {
  tenantId: string;
}

export class TenantContextService {
  private readonly als = new AsyncLocalStorage<TenantStore>();

  run(tenantId: string, callback: () => void) {
    this.als.run({ tenantId }, callback);
  }

  getTenantId(): string | undefined {
    const store = this.als.getStore();
    return store?.tenantId;
  }
}
