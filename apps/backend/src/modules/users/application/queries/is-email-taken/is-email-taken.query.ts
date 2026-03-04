import { IQuery } from '@nestjs/cqrs';

export class IsEmailTakenQuery implements IQuery {
  constructor(public readonly email: string) {}
}
