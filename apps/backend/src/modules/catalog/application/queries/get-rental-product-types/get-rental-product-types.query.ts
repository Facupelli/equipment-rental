import { IQuery } from '@nestjs/cqrs';

export class GetRentalProductTypesQuery implements IQuery {
  constructor(
    public readonly tenantId: string,
    public readonly locationId: string,
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly categoryId?: string,
    public readonly search?: string,
    public readonly page?: number,
    public readonly limit?: number,
  ) {}
}
