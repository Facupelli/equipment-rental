import { IQuery } from '@nestjs/cqrs';

export class FindCustomerForAuthByEmailQuery implements IQuery {
  constructor(
    public readonly email: string,
    public readonly tenantId: string,
  ) {}
}
