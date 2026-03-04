import { IQuery } from '@nestjs/cqrs';

export class FindCredentialsByEmailQuery implements IQuery {
  constructor(public readonly email: string) {}
}
