import { IQuery } from '@nestjs/cqrs';

export class FindTenantBySlugQuery implements IQuery {
  constructor(public readonly slug: string) {}
}
