import { IQuery } from '@nestjs/cqrs';

export class GetAssetByIdQuery implements IQuery {
  constructor(public readonly id: string) {}
}
