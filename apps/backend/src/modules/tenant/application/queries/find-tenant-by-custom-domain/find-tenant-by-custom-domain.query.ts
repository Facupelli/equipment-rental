import { IQuery } from '@nestjs/cqrs';

export class FindTenantByCustomDomainQuery implements IQuery {
  constructor(public readonly domain: string) {}
}
