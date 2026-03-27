import { IQuery } from '@nestjs/cqrs';

export class FindCredentialsByEmailQuery implements IQuery {
  constructor(
    public readonly tenantId: string,
    public readonly email: string,
  ) {}
}
