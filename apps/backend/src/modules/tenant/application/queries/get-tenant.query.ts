import { IQuery } from '@nestjs/cqrs';

export class GetTenantQuery implements IQuery {
  constructor(public readonly tenantId: string) {}
}
