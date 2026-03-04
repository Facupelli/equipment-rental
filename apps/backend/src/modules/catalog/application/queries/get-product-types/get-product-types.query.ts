import { IQuery } from '@nestjs/cqrs';

export class GetProductTypesQuery implements IQuery {
  constructor(
    public readonly categoryId?: string,
    public readonly isActive?: boolean,
    public readonly search?: string,
  ) {}
}
