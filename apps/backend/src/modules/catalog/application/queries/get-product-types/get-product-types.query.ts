import { IQuery } from '@nestjs/cqrs';

export class GetProductTypesQuery implements IQuery {
  constructor(
    public readonly tenantId: string,
    public readonly categoryId?: string,
    public readonly isActive?: boolean,
    public readonly search?: string,
    public readonly page?: number,
    public readonly limit?: number,
  ) {}
}
