import { IQuery } from '@nestjs/cqrs';

export class GetProductCategoriesQuery implements IQuery {
  constructor(public readonly tenantId: string) {}
}
