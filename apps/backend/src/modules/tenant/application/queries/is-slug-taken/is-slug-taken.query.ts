import { IQuery } from '@nestjs/cqrs';

export class IsSlugTakenQuery implements IQuery {
  constructor(public readonly slug: string) {}
}
