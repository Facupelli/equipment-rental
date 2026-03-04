import { IQuery } from '@nestjs/cqrs';

export class GetAssetsQuery implements IQuery {
  constructor(
    public readonly locationId?: string,
    public readonly productTypeId?: string,
    public readonly isActive?: boolean,
    public readonly search?: string,
  ) {}
}
