import { IQuery } from '@nestjs/cqrs';

export class FindCustomerForAuthByIdQuery implements IQuery {
  constructor(public readonly customerId: string) {}
}
